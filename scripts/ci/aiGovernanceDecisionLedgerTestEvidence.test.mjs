import assert from 'node:assert/strict';
import { test } from 'node:test';

import { collectAiGovernanceDecisionLedgerFailures } from './aiGovernanceDecisionLedger.mjs';
import { withAiGovernanceTempRoot, writeFixtureFile } from './aiGovernanceTestFixtures.mjs';

const writeLedgerFixture = (rootDir) => {
  writeFixtureFile(rootDir, 'docs/AI-ASSET-REGISTRY.md', 'registry');
  writeFixtureFile(rootDir, 'docs/AI-GOVERNANCE-DECISIONS.md', [
    '# AI 治理决策记录',
    '',
    '| 日期 | 决策 | 触发条件 | 反例 | 适用边界 | 回写追踪 | 锁定测试 |',
    '| --- | --- | --- | --- | --- | --- | --- |',
    '| 2026-07-07 | 沉淀治理决策 | 重复踩坑 | 只写关键词 | AI rules 和治理脚本 | `docs/AI-ASSET-REGISTRY.md`, `docs/AI-GOVERNANCE-DECISIONS.md`, `CHANGELOG.md` | `node --test scripts/ci/aiGovernanceChecks.test.mjs`; `node scripts/ci/check-ai-governance.mjs` |',
  ].join('\n'));
  writeFixtureFile(rootDir, 'CHANGELOG.md', 'log');
  writeFixtureFile(rootDir, 'scripts/ci/check-ai-governance.mjs', 'check');
};

test('AI 治理决策账本会报告锁定测试文件缺少可执行用例', () => {
  withAiGovernanceTempRoot((rootDir) => {
    writeLedgerFixture(rootDir);
    writeFixtureFile(rootDir, 'scripts/ci/aiGovernanceChecks.test.mjs', "test.skip('跳过的治理测试', () => {});\ntest.todo('待补充治理测试');");

    assert.deepEqual(collectAiGovernanceDecisionLedgerFailures(rootDir), ['docs/AI-GOVERNANCE-DECISIONS.md: 第 1 条决策记录 锁定测试文件缺少可执行 test(...) 或 it(...) 用例 `scripts/ci/aiGovernanceChecks.test.mjs`']);
  });
});

test('AI 治理决策账本接受包含可执行用例的锁定测试文件', () => {
  withAiGovernanceTempRoot((rootDir) => {
    writeLedgerFixture(rootDir);
    writeFixtureFile(rootDir, 'scripts/ci/aiGovernanceChecks.test.mjs', "test('治理负例会失败', () => {});");

    assert.deepEqual(collectAiGovernanceDecisionLedgerFailures(rootDir), []);
  });
});

test('AI 治理决策账本会报告锁定测试文件包含 only 用例', () => {
  withAiGovernanceTempRoot((rootDir) => {
    writeLedgerFixture(rootDir);
    writeFixtureFile(rootDir, 'scripts/ci/aiGovernanceChecks.test.mjs', "test('治理负例会失败', () => {});\ntest.only('临时聚焦调试用例', () => {});");

    assert.deepEqual(collectAiGovernanceDecisionLedgerFailures(rootDir), ['docs/AI-GOVERNANCE-DECISIONS.md: 第 1 条决策记录 锁定测试文件不能包含 test.only(...) 或 it.only(...) `scripts/ci/aiGovernanceChecks.test.mjs`']);
  });
});
