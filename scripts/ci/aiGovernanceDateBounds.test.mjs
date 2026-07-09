import assert from 'node:assert/strict';
import { test } from 'node:test';

import { collectFutureIsoDateFailures, getLocalIsoDate } from './aiGovernanceDateBounds.mjs';
import { collectAiGovernanceDecisionLedgerFailures } from './aiGovernanceDecisionLedger.mjs';
import { collectRegistryFailuresForRows, registryRow, withAiGovernanceTempRoot, writeFixtureFile } from './aiGovernanceTestFixtures.mjs';

test('AI 治理日期边界 helper 会拒绝未来日期', () => {
  assert.equal(getLocalIsoDate(new Date(2026, 6, 9)), '2026-07-09');
  assert.deepEqual(collectFutureIsoDateFailures('记录', '日期', '2026-07-09', '2026-07-09'), []);
  assert.deepEqual(collectFutureIsoDateFailures('记录', '日期', '2026-07-10', '2026-07-09'), [
    '记录 日期不能晚于当前日期，实际 `2026-07-10`',
  ]);
  assert.deepEqual(collectFutureIsoDateFailures('记录', '日期', '2026-02-31', '2026-07-09'), []);
});

test('AI 资产注册表会报告未来复核日期', () => {
  withAiGovernanceTempRoot((rootDir) => {
    const failures = collectRegistryFailuresForRows(rootDir, [
      registryRow('AGENTS.md', { reviewDate: '9999-01-01' }),
    ], [
      'AGENTS.md',
      'docs/AI-ASSET-REGISTRY.md',
    ]);

    assert.deepEqual(failures, [
      'docs/AI-ASSET-REGISTRY.md: AI 资产登记 `AGENTS.md` 最近复核日期不能晚于当前日期，实际 `9999-01-01`',
    ]);
  });
});

test('AI 治理决策账本会报告未来决策日期', () => {
  withAiGovernanceTempRoot((rootDir) => {
    writeFixtureFile(rootDir, 'docs/AI-ASSET-REGISTRY.md', 'registry');
    writeFixtureFile(rootDir, 'CHANGELOG.md', 'log');
    writeFixtureFile(rootDir, 'scripts/ci/aiGovernanceChecks.test.mjs', "test('fixture', () => {});");
    writeFixtureFile(rootDir, 'scripts/ci/check-ai-governance.mjs', 'check');
    writeFixtureFile(rootDir, 'docs/AI-GOVERNANCE-DECISIONS.md', [
      '| 日期 | 决策 | 触发条件 | 反例 | 适用边界 | 回写追踪 | 锁定测试 |',
      '| --- | --- | --- | --- | --- | --- | --- |',
      '| 9999-01-01 | 未来记录 | 触发 | 反例 | 边界 | `docs/AI-ASSET-REGISTRY.md`, `docs/AI-GOVERNANCE-DECISIONS.md`, `CHANGELOG.md` | `node --test scripts/ci/aiGovernanceChecks.test.mjs`; `node scripts/ci/check-ai-governance.mjs` |',
    ].join('\n'));

    assert.deepEqual(collectAiGovernanceDecisionLedgerFailures(rootDir), [
      'docs/AI-GOVERNANCE-DECISIONS.md: 第 1 条决策记录 日期不能晚于当前日期，实际 `9999-01-01`',
    ]);
  });
});
