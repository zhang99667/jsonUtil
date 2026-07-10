import assert from 'node:assert/strict';
import { test } from 'node:test';

import { collectAiGovernanceDecisionLedgerFailures } from './aiGovernanceDecisionLedger.mjs';
import { writeDecisionLedgerBackfillFiles } from './aiGovernanceDecisionLedgerTestFixtures.mjs';
import { withAiGovernanceTempRoot, writeFixtureFile } from './aiGovernanceTestFixtures.mjs';

test('AI 治理决策账本会报告锁定测试文件缺少可执行用例', () => {
  withAiGovernanceTempRoot((rootDir) => {
    writeDecisionLedgerBackfillFiles(rootDir);
    writeFixtureFile(rootDir, 'scripts/ci/aiGovernanceChecks.test.mjs', "test.skip('跳过的治理测试', () => {});\ntest.todo('待补充治理测试');");

    assert.deepEqual(collectAiGovernanceDecisionLedgerFailures(rootDir), ['docs/AI-GOVERNANCE-DECISIONS.md: 第 1 条决策记录 锁定测试文件缺少可执行 test(...) 或 it(...) 用例 `scripts/ci/aiGovernanceChecks.test.mjs`']);
  });
});

test('AI 治理决策账本接受包含可执行用例的锁定测试文件', () => {
  withAiGovernanceTempRoot((rootDir) => {
    writeDecisionLedgerBackfillFiles(rootDir);
    writeFixtureFile(rootDir, 'scripts/ci/aiGovernanceChecks.test.mjs', "test('治理负例会失败', () => {});");

    assert.deepEqual(collectAiGovernanceDecisionLedgerFailures(rootDir), []);
  });
});

test('AI 治理决策账本会报告锁定测试文件包含 only 用例', () => {
  withAiGovernanceTempRoot((rootDir) => {
    writeDecisionLedgerBackfillFiles(rootDir);
    writeFixtureFile(rootDir, 'scripts/ci/aiGovernanceChecks.test.mjs', "test('治理负例会失败', () => {});\ntest.only('临时聚焦调试用例', () => {});");

    assert.deepEqual(collectAiGovernanceDecisionLedgerFailures(rootDir), ['docs/AI-GOVERNANCE-DECISIONS.md: 第 1 条决策记录 锁定测试文件不能包含 test.only(...) 或 it.only(...) `scripts/ci/aiGovernanceChecks.test.mjs`']);
  });
});
