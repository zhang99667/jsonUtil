import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';

import {
  buildSkillMandatoryContextMetrics,
  collectSkillMandatoryContextBudgetFailures,
} from './aiGovernanceCodexSkillContextBudgetContract.mjs';

const withRoot = (run) => {
  const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'jsonutils-context-set-'));
  try { return run(rootDir); } finally { fs.rmSync(rootDir, { recursive: true, force: true }); }
};
const contentFor = references => `# Skill\n## 必读文件\n${references.map(item => `- \`${item}\``).join('\n')}\n`;
const failuresFor = (rootDir, references) => collectSkillMandatoryContextBudgetFailures(
  rootDir,
  '.agents/skills/demo/SKILL.md',
  contentFor(references),
);

test('Codex skill 必读 path-like 引用缺失、越界或 dangling 时 fail closed', () => withRoot((rootDir) => {
  fs.symlinkSync('missing-directory', path.join(rootDir, 'dangling'), 'dir');
  for (const reference of ['missing.md', '../outside.md', 'dangling/file.md']) {
    assert.deepEqual(failuresFor(rootDir, [reference]), [
      `.agents/skills/demo/SKILL.md: ${reference}: 必读上下文项目路径不存在、越界或不可解析`,
    ]);
  }
}));

test('Codex skill 必读普通反引号术语不冒充项目路径', () => withRoot((rootDir) => {
  const content = contentFor(['component-only', 'schemaVersion', 'outcome/receipt']);
  const metrics = buildSkillMandatoryContextMetrics(rootDir, '.agents/skills/demo/SKILL.md', content);
  assert.deepEqual(metrics.referencedFiles, []);
  assert.deepEqual(collectSkillMandatoryContextBudgetFailures(rootDir, metrics.file, content), []);
}));

test('Codex skill 必读引用集合拒绝测量后回改先前文件', () => withRoot((rootDir) => {
  fs.writeFileSync(path.join(rootDir, 'a.md'), 'a');
  fs.writeFileSync(path.join(rootDir, 'b.md'), 'b');
  const originalOpenSync = fs.openSync;
  const secondPath = fs.realpathSync(path.join(rootDir, 'b.md'));
  let mutated = false;
  fs.openSync = (target, ...args) => {
    if (!mutated && target === secondPath) {
      mutated = true;
      fs.appendFileSync(path.join(rootDir, 'a.md'), 'x'.repeat(80_000));
    }
    return originalOpenSync(target, ...args);
  };
  try {
    assert.throws(
      () => buildSkillMandatoryContextMetrics(rootDir, '.agents/skills/demo/SKILL.md', contentFor(['a.md', 'b.md'])),
      /必读上下文路径集合在读取期间发生整体漂移/u,
    );
  } finally {
    fs.openSync = originalOpenSync;
  }
}));
