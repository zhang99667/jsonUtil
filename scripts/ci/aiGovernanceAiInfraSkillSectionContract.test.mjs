import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

import { collectSkillSectionContentFailures } from './aiGovernanceCodexSkillSectionContract.mjs';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const skillFile = '.agents/skills/jsonutils-ai-infra-evolver/SKILL.md';
const skillContent = fs.readFileSync(path.join(rootDir, skillFile), 'utf8');
const requiredMarkers = [
  ['同一任务', '## 工作流'],
  ['隔离可写工作区', '## 工作流'],
  ['execution transcript', '## 工作流'],
  ['前后状态快照', '## 工作流'],
  ['deterministic-case', '## 工作流'],
  ['component-only', '## 工作流'],
  ['schemaVersion 3', '## 工作流'],
  ['chain.sequence', '## 工作流'],
  ['chain.previousHash', '## 工作流'],
  ['supersession.previousOutcomeId', '## 工作流'],
  ['feedbackDisposition', '## 工作流'],
  ['trial receipt', '## 工作流'],
  ['即时重放', '## 工作流'],
  ['legacy', '## 工作流'],
  ['node scripts/ci/run-ai-evolution-cases.mjs', '## 常用验证命令'],
];

test('AI 基建 skill 章节契约锁定 A/B 隔离与 evidence scope', () => {
  requiredMarkers.forEach(([marker, sectionTitle]) => {
    const failures = collectSkillSectionContentFailures(skillFile, skillContent.replaceAll(marker, ''));
    assert.ok(failures.includes(`${skillFile}: ${sectionTitle} 缺少 "${marker}"`));
  });
});
