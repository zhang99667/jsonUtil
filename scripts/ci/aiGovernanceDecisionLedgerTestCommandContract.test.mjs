import assert from 'node:assert/strict';
import { test } from 'node:test';

import { collectAiGovernanceDecisionLedgerFailures } from './aiGovernanceDecisionLedger.mjs';
import {
  buildDecisionLedgerFixtureContent,
  writeDecisionLedgerBackfillFiles,
} from './aiGovernanceDecisionLedgerTestFixtures.mjs';
import { withAiGovernanceTempRoot, writeFixtureFile } from './aiGovernanceTestFixtures.mjs';

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

test('AI 治理决策账本接受 MCP server 单测作为 CI 覆盖的锁定测试', () => {
  withAiGovernanceTempRoot((rootDir) => {
    writeDecisionLedgerBackfillFiles(rootDir);
    writeFixtureFile(rootDir, 'scripts/mcp/jsonutils-governance-server.test.mjs', "test('fixture', () => {});");
    writeFixtureFile(rootDir, 'docs/AI-GOVERNANCE-DECISIONS.md', buildDecisionLedgerFixtureContent({
      tests: '`node --test scripts/mcp/jsonutils-governance-server.test.mjs`; `node scripts/ci/check-ai-governance.mjs`',
    }));

    assert.deepEqual(collectAiGovernanceDecisionLedgerFailures(rootDir), []);
  });
});

test('AI 治理决策账本接受项目 controller probe 的 CI 锁定测试', () => {
  withAiGovernanceTempRoot((rootDir) => {
    writeDecisionLedgerBackfillFiles(rootDir);
    const file = 'plugins/ai-infra-controller-probe/skills/probe-codex-controller-runtime/scripts/controller-probe.test.mjs';
    writeFixtureFile(rootDir, file, "test('fixture', () => {});");
    writeFixtureFile(rootDir, 'docs/AI-GOVERNANCE-DECISIONS.md', buildDecisionLedgerFixtureContent({
      tests: `\`node --test ${file}\`; \`node scripts/ci/check-ai-governance.mjs\``,
    }));

    assert.deepEqual(collectAiGovernanceDecisionLedgerFailures(rootDir), []);
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
