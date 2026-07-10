import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';

import { buildJsonutilsDecisionSummary } from './jsonutils-governance-decisions.mjs';

const withDecisionFile = (content, run) => {
  const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'jsonutils-decisions-'));
  fs.mkdirSync(path.join(rootDir, 'docs'), { recursive: true });
  fs.writeFileSync(path.join(rootDir, 'docs/AI-GOVERNANCE-DECISIONS.md'), content);
  try {
    return run(rootDir);
  } finally {
    fs.rmSync(rootDir, { recursive: true, force: true });
  }
};

test('decision summary returns bounded structured governance rows', () => {
  withDecisionFile([
    '| 日期 | 决策 | 触发条件 | 反例 | 适用边界 | 回写追踪 | 锁定测试 |',
    '| --- | --- | --- | --- | --- | --- | --- |',
    '| 2026-07-10 | 决策 A | 触发 A | 反例 A | 边界 A | `a.md`, `b.mjs` | `node --test a.test.mjs`; `node scripts/ci/check-ai-governance.mjs` |',
    '| 2026-07-09 | 决策 B | 触发 B | 反例 B | 边界 B | `c.md` | `node --test b.test.mjs` |',
  ].join('\n'), (rootDir) => {
    const summary = buildJsonutilsDecisionSummary({ limit: 1, cwd: rootDir });

    assert.equal(summary.reportType, 'jsonutils-decision-summary');
    assert.equal(summary.ok, true);
    assert.equal(summary.totalDecisions, 2);
    assert.equal(summary.decisions.length, 1);
    assert.deepEqual(summary.decisions[0].writebackFiles, ['a.md', 'b.mjs']);
    assert.deepEqual(summary.decisions[0].validationCommands, [
      'node --test a.test.mjs',
      'node scripts/ci/check-ai-governance.mjs',
    ]);
  });
});
