import assert from 'node:assert/strict';
import { test } from 'node:test';

import { collectAiGovernanceDecisionLedgerFailures } from './aiGovernanceDecisionLedger.mjs';
import { withAiGovernanceTempRoot, writeFixtureFile } from './aiGovernanceTestFixtures.mjs';

const buildDecisionLedgerFixtureContent = ({
  date = '2026-07-07',
  decision = '沉淀治理决策',
  trigger = '重复踩坑',
  counterexample = '只写关键词',
  boundary = 'AI rules 和治理脚本',
  backfill = '`docs/AI-ASSET-REGISTRY.md`, `docs/AI-GOVERNANCE-DECISIONS.md`, `CHANGELOG.md`',
  tests = '`node --test scripts/ci/aiGovernanceChecks.test.mjs`; `node scripts/ci/check-ai-governance.mjs`',
} = {}) => [
  '# AI 治理决策记录',
  '',
  '| 日期 | 决策 | 触发条件 | 反例 | 适用边界 | 回写追踪 | 锁定测试 |',
  '| --- | --- | --- | --- | --- | --- | --- |',
  `| ${date} | ${decision} | ${trigger} | ${counterexample} | ${boundary} | ${backfill} | ${tests} |`,
].join('\n');

const writeDecisionLedgerBackfillFiles = (rootDir) => {
  writeFixtureFile(rootDir, 'docs/AI-ASSET-REGISTRY.md', 'registry');
  writeFixtureFile(rootDir, 'docs/AI-GOVERNANCE-DECISIONS.md', 'ledger');
  writeFixtureFile(rootDir, 'CHANGELOG.md', 'log');
  writeFixtureFile(rootDir, 'scripts/ci/aiGovernanceChecks.test.mjs', "test('fixture', () => {});");
  writeFixtureFile(rootDir, 'scripts/ci/check-ai-governance.mjs', 'check');
};

test('AI 治理决策账本会报告缺少结构化表格', () => {
  withAiGovernanceTempRoot((rootDir) => {
    writeFixtureFile(rootDir, 'docs/AI-GOVERNANCE-DECISIONS.md', [
      '# AI 治理决策记录',
      '| 日期 | 决策 |',
      '| --- | --- |',
      '| 2026-07-07 | 不完整记录 |',
    ].join('\n'));

    assert.deepEqual(collectAiGovernanceDecisionLedgerFailures(rootDir), [
      'docs/AI-GOVERNANCE-DECISIONS.md: 缺少决策记录表格',
    ]);
  });
});

test('AI 治理决策账本会报告非法日期、缺少回写路径和锁定测试命令', () => {
  withAiGovernanceTempRoot((rootDir) => {
    writeDecisionLedgerBackfillFiles(rootDir);
    writeFixtureFile(rootDir, 'docs/AI-GOVERNANCE-DECISIONS.md', buildDecisionLedgerFixtureContent({
      date: '2026-02-31',
      trigger: 'TODO',
      counterexample: '无',
      boundary: 'TBD',
      backfill: '只写自然语言',
      tests: '人工看过',
    }));

    assert.deepEqual(collectAiGovernanceDecisionLedgerFailures(rootDir), [
      'docs/AI-GOVERNANCE-DECISIONS.md: 第 1 条决策记录 日期必须使用有效 YYYY-MM-DD',
      'docs/AI-GOVERNANCE-DECISIONS.md: 第 1 条决策记录 触发条件不能使用弱占位内容 `TODO`',
      'docs/AI-GOVERNANCE-DECISIONS.md: 第 1 条决策记录 反例不能使用弱占位内容 `无`',
      'docs/AI-GOVERNANCE-DECISIONS.md: 第 1 条决策记录 适用边界不能使用弱占位内容 `TBD`',
      'docs/AI-GOVERNANCE-DECISIONS.md: 第 1 条决策记录 回写追踪必须包含反引号路径',
      'docs/AI-GOVERNANCE-DECISIONS.md: 第 1 条决策记录 回写追踪必须包含 `CHANGELOG.md`',
      'docs/AI-GOVERNANCE-DECISIONS.md: 第 1 条决策记录 回写追踪必须包含 `docs/AI-GOVERNANCE-DECISIONS.md`',
      'docs/AI-GOVERNANCE-DECISIONS.md: 第 1 条决策记录 锁定测试必须包含可执行命令',
      'docs/AI-GOVERNANCE-DECISIONS.md: 第 1 条决策记录 锁定测试必须包含 `node scripts/ci/check-ai-governance.mjs`',
    ]);
  });
});

test('AI 治理决策账本会报告不存在的回写路径', () => {
  withAiGovernanceTempRoot((rootDir) => {
    writeDecisionLedgerBackfillFiles(rootDir);
    writeFixtureFile(rootDir, 'docs/AI-GOVERNANCE-DECISIONS.md', buildDecisionLedgerFixtureContent({
      backfill: '`docs/AI-MISSING.md`, `docs/AI-GOVERNANCE-DECISIONS.md`, `CHANGELOG.md`',
    }));

    assert.deepEqual(collectAiGovernanceDecisionLedgerFailures(rootDir), [
      'docs/AI-GOVERNANCE-DECISIONS.md: 第 1 条决策记录 回写追踪路径不存在 `docs/AI-MISSING.md`',
    ]);
  });
});

test('AI 治理决策账本会报告回写追踪缺少 CHANGELOG', () => {
  withAiGovernanceTempRoot((rootDir) => {
    writeDecisionLedgerBackfillFiles(rootDir);
    writeFixtureFile(rootDir, 'docs/AI-GOVERNANCE-DECISIONS.md', buildDecisionLedgerFixtureContent({
      backfill: '`docs/AI-ASSET-REGISTRY.md`',
    }));

    assert.deepEqual(collectAiGovernanceDecisionLedgerFailures(rootDir), [
      'docs/AI-GOVERNANCE-DECISIONS.md: 第 1 条决策记录 回写追踪必须包含 `CHANGELOG.md`',
      'docs/AI-GOVERNANCE-DECISIONS.md: 第 1 条决策记录 回写追踪必须包含 `docs/AI-GOVERNANCE-DECISIONS.md`',
    ]);
  });
});

test('AI 治理决策账本会报告不存在的锁定测试命令路径', () => {
  withAiGovernanceTempRoot((rootDir) => {
    writeDecisionLedgerBackfillFiles(rootDir);
    writeFixtureFile(rootDir, 'docs/AI-GOVERNANCE-DECISIONS.md', buildDecisionLedgerFixtureContent({
      tests: '`node --test scripts/ci/missing-check.test.mjs`; `node scripts/ci/check-ai-governance.mjs`',
    }));

    assert.deepEqual(collectAiGovernanceDecisionLedgerFailures(rootDir), [
      'docs/AI-GOVERNANCE-DECISIONS.md: 第 1 条决策记录 锁定测试命令路径不存在 `scripts/ci/missing-check.test.mjs`',
    ]);
  });
});

test('AI 治理决策账本会报告多测试命令中的后续缺失路径', () => {
  withAiGovernanceTempRoot((rootDir) => {
    writeDecisionLedgerBackfillFiles(rootDir);
    writeFixtureFile(rootDir, 'docs/AI-GOVERNANCE-DECISIONS.md', buildDecisionLedgerFixtureContent({
      tests: '`node --test scripts/ci/aiGovernanceChecks.test.mjs scripts/ci/missing-second.test.mjs`; `node scripts/ci/check-ai-governance.mjs`',
    }));

    assert.deepEqual(collectAiGovernanceDecisionLedgerFailures(rootDir), [
      'docs/AI-GOVERNANCE-DECISIONS.md: 第 1 条决策记录 锁定测试命令路径不存在 `scripts/ci/missing-second.test.mjs`',
    ]);
  });
});

test('AI 治理决策账本会报告未被 CI 脚本单测覆盖的锁定测试', () => {
  withAiGovernanceTempRoot((rootDir) => {
    writeDecisionLedgerBackfillFiles(rootDir);
    writeFixtureFile(rootDir, 'tests/ai-governance.test.mjs', 'test');
    writeFixtureFile(rootDir, 'docs/AI-GOVERNANCE-DECISIONS.md', buildDecisionLedgerFixtureContent({
      tests: '`node --test tests/ai-governance.test.mjs`; `node scripts/ci/check-ai-governance.mjs`',
    }));

    assert.deepEqual(collectAiGovernanceDecisionLedgerFailures(rootDir), [
      'docs/AI-GOVERNANCE-DECISIONS.md: 第 1 条决策记录 锁定测试命令未纳入 CI 脚本单测集合 `tests/ai-governance.test.mjs`',
    ]);
  });
});

test('AI 治理决策账本会报告日期顺序倒置', () => {
  withAiGovernanceTempRoot((rootDir) => {
    writeDecisionLedgerBackfillFiles(rootDir);
    writeFixtureFile(rootDir, 'docs/AI-GOVERNANCE-DECISIONS.md', [
      '# AI 治理决策记录',
      '',
      '| 日期 | 决策 | 触发条件 | 反例 | 适用边界 | 回写追踪 | 锁定测试 |',
      '| --- | --- | --- | --- | --- | --- | --- |',
      '| 2026-07-07 | 旧记录 | 触发 | 反例 | 边界 | `docs/AI-ASSET-REGISTRY.md`, `docs/AI-GOVERNANCE-DECISIONS.md`, `CHANGELOG.md` | `node --test scripts/ci/aiGovernanceChecks.test.mjs`; `node scripts/ci/check-ai-governance.mjs` |',
      '| 2026-07-08 | 新记录 | 触发 | 反例 | 边界 | `docs/AI-ASSET-REGISTRY.md`, `docs/AI-GOVERNANCE-DECISIONS.md`, `CHANGELOG.md` | `node --test scripts/ci/aiGovernanceChecks.test.mjs`; `node scripts/ci/check-ai-governance.mjs` |',
    ].join('\n'));

    assert.deepEqual(collectAiGovernanceDecisionLedgerFailures(rootDir), [
      'docs/AI-GOVERNANCE-DECISIONS.md: 第 2 条决策记录 日期必须不晚于上一条记录',
    ]);
  });
});

test('AI 治理决策账本会报告缺少回归或负向测试命令', () => {
  withAiGovernanceTempRoot((rootDir) => {
    writeDecisionLedgerBackfillFiles(rootDir);
    writeFixtureFile(rootDir, 'docs/AI-GOVERNANCE-DECISIONS.md', buildDecisionLedgerFixtureContent({
      tests: '`node scripts/ci/aiGovernanceChecks.test.mjs`; `node scripts/ci/check-ai-governance.mjs`',
    }));

    assert.deepEqual(collectAiGovernanceDecisionLedgerFailures(rootDir), [
      'docs/AI-GOVERNANCE-DECISIONS.md: 第 1 条决策记录 锁定测试必须包含 `node --test ...test.mjs` 回归或负向测试命令',
    ]);
  });
});
