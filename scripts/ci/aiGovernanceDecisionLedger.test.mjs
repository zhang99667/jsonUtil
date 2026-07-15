import assert from 'node:assert/strict';
import { test } from 'node:test';

import { collectAiGovernanceDecisionLedgerFailures } from './aiGovernanceDecisionLedger.mjs';
import {
  buildDecisionLedgerFixtureContent,
  writeDecisionLedgerBackfillFiles,
} from './aiGovernanceDecisionLedgerTestFixtures.mjs';
import { withAiGovernanceTempRoot, writeFixtureFile } from './aiGovernanceTestFixtures.mjs';

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

test('AI 治理决策账本只允许已登记的历史 skill 路径迁移', () => {
  withAiGovernanceTempRoot((rootDir) => {
    writeDecisionLedgerBackfillFiles(rootDir);
    writeFixtureFile(rootDir, '.agents/skills/jsonutils-maintainer/SKILL.md', 'canonical');
    writeFixtureFile(rootDir, 'docs/AI-GOVERNANCE-DECISIONS.md', buildDecisionLedgerFixtureContent({
      backfill: '`.codex/skills/jsonutils-maintainer/SKILL.md`, `docs/AI-GOVERNANCE-DECISIONS.md`, `CHANGELOG.md`',
    }));
    assert.deepEqual(collectAiGovernanceDecisionLedgerFailures(rootDir), []);
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
