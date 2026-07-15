import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import {
  buildSkillMandatoryContextMetrics,
  collectSkillMandatoryContextBudgetFailures,
  MAX_CODEX_SKILL_EFFECTIVE_CONTEXT_BYTES,
} from './aiGovernanceCodexSkillContextBudgetContract.mjs';

const withFixture = (files, run) => {
  const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'jsonutils-skill-context-'));
  for (const [file, content] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(path.join(rootDir, file)), { recursive: true });
    fs.writeFileSync(path.join(rootDir, file), content);
  }
  try { return run(rootDir); } finally { fs.rmSync(rootDir, { recursive: true, force: true }); }
};
const metricsFor = (rootDir, reference) => buildSkillMandatoryContextMetrics(rootDir,
  '.agents/skills/demo/SKILL.md', `# Skill\n## 必读文件\n- \`${reference}\`\n`);

test('Codex skill 必读上下文预算只统计必读章节', () => withFixture({ 'AGENTS.md': 'small', 'docs/history.md': 'x'.repeat(100_000) }, (rootDir) => {
  const content = '# Skill\n## 必读文件\n- `AGENTS.md`\n## 按任务读取\n- `docs/history.md`\n';
  const metrics = buildSkillMandatoryContextMetrics(rootDir, '.agents/skills/demo/SKILL.md', content);
  assert.deepEqual(metrics.referencedFiles, ['AGENTS.md']);
  assert.equal(metrics.referencedBytes, 5);
  assert.deepEqual(collectSkillMandatoryContextBudgetFailures(rootDir, metrics.file, content), []);
}));

test('Codex skill 必读上下文统计 .codex、源码、JSON 和整个目录', () => withFixture({
  '.codex/config.json': 'config',
  'frontend/src/main.tsx': 'source-code',
  'evals/cases.json': 'cases',
  'rules/ai/core.txt': 'core',
  'rules/ai/nested/extra.txt': 'extra',
}, (rootDir) => {
  const content = '# Skill\n## 必读文件\n- `.codex/config.json`\n- `frontend/src/main.tsx`\n- `evals/cases.json`\n- `rules/ai`';
  const metrics = buildSkillMandatoryContextMetrics(rootDir, '.agents/skills/demo/SKILL.md', content);
  assert.deepEqual(metrics.referencedFiles, ['.codex/config.json', 'frontend/src/main.tsx', 'evals/cases.json', 'rules/ai']);
  assert.equal(metrics.referencedBytes, 6 + 11 + 5 + 9);
}));

test('Codex skill 必读列表的真实项目路径必须用反引号包裹', () => withFixture({ 'rules/code-style.md': 'rules', 'docs/huge.md': 'large-document' }, (rootDir) => {
  const content = '# Skill\n## 必读文件\n1. rules/code-style.md: 编码规范\n普通段落引用 **docs/huge.md**。\n';
  assert.deepEqual(
    collectSkillMandatoryContextBudgetFailures(rootDir, '.agents/skills/demo/SKILL.md', content),
    ['.agents/skills/demo/SKILL.md: 必读项目路径必须用反引号包裹 `rules/code-style.md`，否则上下文预算会漏算', '.agents/skills/demo/SKILL.md: 必读项目路径必须用反引号包裹 `docs/huge.md`，否则上下文预算会漏算'],
  );
}));

test('Codex skill 必读路径片段仍按真实文件计费', () => withFixture({ 'docs/huge.md': 'large-document' }, (rootDir) => {
  const content = '# Skill\n## 必读文件\n- `docs/huge.md#data-model`\n';
  const metrics = buildSkillMandatoryContextMetrics(rootDir, '.agents/skills/demo/SKILL.md', content);
  assert.deepEqual(metrics.referencedFiles, ['docs/huge.md']);
  assert.equal(metrics.referencedBytes, 14);
}));

test('Codex skill 必读路径对 symlink、realpath 逃逸、非普通节点和读取漂移 fail closed', () => {
  const outside = fs.mkdtempSync(path.join(os.tmpdir(), 'jsonutils-skill-context-outside-'));
  try {
    fs.writeFileSync(path.join(outside, 'outside.md'), 'outside');
    return withFixture({ 'AGENTS.md': 'small', 'real.md': 'real', 'special.md': 'special' }, (rootDir) => {
      fs.symlinkSync('real.md', path.join(rootDir, 'link.md'));
      fs.symlinkSync(outside, path.join(rootDir, 'escape'), 'dir');
      assert.throws(() => metricsFor(rootDir, 'link.md'), /symlink/);
      assert.throws(() => metricsFor(rootDir, 'escape\/outside.md'), /realpath 逃逸仓库/);
      const specialPath = fs.realpathSync(path.join(rootDir, 'special.md')); const lstatSync = fs.lstatSync;
      fs.lstatSync = (target, options) => { const stat = lstatSync(target, options); return target === specialPath
        ? { ...stat, isFile: () => false, isDirectory: () => false, isSymbolicLink: () => false } : stat; };
      try { assert.throws(() => metricsFor(rootDir, 'special.md'), /普通文件或目录/); } finally { fs.lstatSync = lstatSync; }
      const target = fs.realpathSync(path.join(rootDir, 'AGENTS.md')); const realpathSync = fs.realpathSync; let targetReads = 0;
      fs.realpathSync = (value, ...args) => { const real = realpathSync(value, ...args);
        if (value === target && targetReads++ === 0) fs.appendFileSync(target, 'x'); return real; };
      try { assert.throws(() => metricsFor(rootDir, 'AGENTS.md'), /读取期间发生漂移/); } finally { fs.realpathSync = realpathSync; }
    });
  } finally { fs.rmSync(outside, { recursive: true, force: true }); }
});

test('Codex skill 必读上下文必须保留 16 KiB 演进余量', () => withFixture({}, (rootDir) => {
  const prefix = '# Skill\n## 必读文件\n';
  const atLimit = `${prefix}${'x'.repeat(MAX_CODEX_SKILL_EFFECTIVE_CONTEXT_BYTES - Buffer.byteLength(prefix))}`;
  assert.deepEqual(collectSkillMandatoryContextBudgetFailures(rootDir, '.agents/skills/demo/SKILL.md', atLimit), []);
  const failures = collectSkillMandatoryContextBudgetFailures(rootDir, '.agents/skills/demo/SKILL.md', `${atLimit}x`);
  assert.equal(failures.length, 1);
  assert.match(failures[0], /超过 75776 bytes 有效预算，92160 bytes 总预算必须保留 16384 bytes 演进余量/);
}));
