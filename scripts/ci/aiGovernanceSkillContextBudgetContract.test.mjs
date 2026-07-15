import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import {
  buildSkillMandatoryContextMetrics,
  collectSkillMandatoryContextBudgetFailures,
} from './aiGovernanceCodexSkillContextBudgetContract.mjs';

const withFixture = (files, run) => {
  const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'jsonutils-skill-context-'));
  for (const [file, content] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(path.join(rootDir, file)), { recursive: true });
    fs.writeFileSync(path.join(rootDir, file), content);
  }
  try {
    return run(rootDir);
  } finally {
    fs.rmSync(rootDir, { recursive: true, force: true });
  }
};

test('Codex skill 必读上下文预算只统计必读章节', () => withFixture({
  'AGENTS.md': 'small',
  'docs/history.md': 'x'.repeat(100_000),
}, (rootDir) => {
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
  const content = [
    '# Skill',
    '## 必读文件',
    '- `.codex/config.json`',
    '- `frontend/src/main.tsx`',
    '- `evals/cases.json`',
    '- `rules/ai`',
  ].join('\n');
  const metrics = buildSkillMandatoryContextMetrics(rootDir, '.agents/skills/demo/SKILL.md', content);
  assert.deepEqual(metrics.referencedFiles, [
    '.codex/config.json',
    'frontend/src/main.tsx',
    'evals/cases.json',
    'rules/ai',
  ]);
  assert.equal(metrics.referencedBytes, 6 + 11 + 5 + 9);
}));

test('Codex skill 必读列表的真实项目路径必须用反引号包裹', () => withFixture({
  'rules/code-style.md': 'rules',
  'docs/huge.md': 'large-document',
}, (rootDir) => {
  const content = '# Skill\n## 必读文件\n1. rules/code-style.md: 编码规范\n普通段落引用 **docs/huge.md**。\n';
  assert.deepEqual(
    collectSkillMandatoryContextBudgetFailures(rootDir, '.agents/skills/demo/SKILL.md', content),
    [
      '.agents/skills/demo/SKILL.md: 必读项目路径必须用反引号包裹 `rules/code-style.md`，否则上下文预算会漏算',
      '.agents/skills/demo/SKILL.md: 必读项目路径必须用反引号包裹 `docs/huge.md`，否则上下文预算会漏算',
    ],
  );
}));

test('Codex skill 必读路径片段仍按真实文件计费', () => withFixture({
  'docs/huge.md': 'large-document',
}, (rootDir) => {
  const content = '# Skill\n## 必读文件\n- `docs/huge.md#data-model`\n';
  const metrics = buildSkillMandatoryContextMetrics(rootDir, '.agents/skills/demo/SKILL.md', content);
  assert.deepEqual(metrics.referencedFiles, ['docs/huge.md']);
  assert.equal(metrics.referencedBytes, 14);
}));

test('Codex skill 必读上下文超过预算时失败', () => withFixture({
  'frontend/src/large.ts': 'x'.repeat(100_000),
}, (rootDir) => {
  const content = '# Skill\n## 必读文件\n- `frontend/src/large.ts`\n';
  const failures = collectSkillMandatoryContextBudgetFailures(rootDir, '.agents/skills/demo/SKILL.md', content);
  assert.equal(failures.length, 1);
  assert.match(failures[0], /超过 92160 bytes 预算/);
}));
