import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  withJsonutilsGovernanceMcpTempRoot,
  writeJsonutilsGovernanceMcpFixtureFile,
} from '../ci/jsonutilsGovernanceMcpTestFixtures.mjs';
import { buildJsonutilsGovernanceContext } from './jsonutils-governance-context.mjs';

const READY_SCOPE = { ok: true, counts: { assets: 2, failures: 0 }, failureSample: [], truncated: false };
const DISTRIBUTION_READINESS = {
  schemaVersion: 1, reportType: 'ai-asset-distribution-readiness', ok: true,
  stability: { status: 'stable', sourceDrift: 0, gitInventoryDrift: 0, sourceReadErrors: 0, gitInventoryErrors: 0 },
  counts: { assets: 2, failedScopes: 0 }, readiness: { workspaceCandidate: true, nextCommit: true, clone: true },
  scopes: { workspace: READY_SCOPE, index: READY_SCOPE, head: READY_SCOPE },
};

test('governance context combines reports, project version and latest decision', async () => {
  await withJsonutilsGovernanceMcpTempRoot(async (rootDir) => {
    writeJsonutilsGovernanceMcpFixtureFile(rootDir, 'frontend/package.json', JSON.stringify({ name: 'json-helper-ai-fix', version: '1.2.3' }));
    writeJsonutilsGovernanceMcpFixtureFile(rootDir, 'CHANGELOG.md', '# 更新日志\n## v1.2.3 (2026-07-10) - Context\n');
    writeJsonutilsGovernanceMcpFixtureFile(rootDir, 'docs/AI-GOVERNANCE-DECISIONS.md', [
      '# AI 治理决策记录',
      '| 日期 | 决策 | 触发条件 | 反例 | 适用边界 | 回写追踪 | 锁定测试 |',
      '| --- | --- | --- | --- | --- | --- | --- |',
      '| 2026-07-10 | 建立上下文快照 | 触发 | 反例 | 边界 | `docs/AI-GOVERNANCE-DECISIONS.md`, `CHANGELOG.md` | `node --test scripts/mcp/jsonutils-governance-context.test.mjs`; `node scripts/ci/check-ai-governance.mjs` |',
    ].join('\n'));

    const calls = [];
    const runScript = async (script, args) => {
      calls.push([script, args]);
      const stdout = script.includes('check-ai-governance')
        ? JSON.stringify({
          ok: true,
          counts: { requiredFiles: 2, referenceRules: 1 },
          failures: { missingFiles: [], skillContractFailures: [], contractFailures: [], missingReferences: [] },
          distributionReadiness: DISTRIBUTION_READINESS,
        })
        : JSON.stringify({
          ok: true,
          counts: { budgets: 1 },
          items: {
            highUsage: [{ file: 'frontend/src/App.tsx', lineCount: 98, maxLines: 100, remainingLines: 2, usageRatio: 0.98 }],
            scorecardCandidates: [
              { file: 'frontend/src/App.tsx', lineCount: 98, maxLines: 100, remainingLines: 2, usageRatio: 0.98 },
              { file: 'scripts/ci/aiGovernanceTruth.mjs', lineCount: 90, maxLines: 100, remainingLines: 10, usageRatio: 0.9 },
            ],
          },
        });
      return { exitCode: 0, stdout, stderr: '' };
    };

    const context = await buildJsonutilsGovernanceContext({ rootDir, top: 1, runScript });

    assert.equal(context.reportType, 'jsonutils-governance-context');
    assert.equal(context.project.version, '1.2.3');
    assert.deepEqual(context.project.latestDecision, { date: '2026-07-10', decision: '建立上下文快照' });
    assert.equal(context.maturityScorecard.nextFocus.id, 'maintainability-headroom');
    assert.equal(context.maturityScorecard.nextFocus.status, 'warn');
    assert.deepEqual(context.distributionReadiness, DISTRIBUTION_READINESS);
    assert.equal(context.maturityScorecard.dimensions.find(item => item.id === 'distribution-readiness').status, 'pass');
    assert.deepEqual(context.maintainability.highUsage.map(item => item.file), ['frontend/src/App.tsx']);
    assert.equal(context.maturityScorecard.dimensions.at(-1).details.maintainabilityHotspots.aiCandidateCount, 1);
    assert.deepEqual(calls.map(([script]) => script), [
      'scripts/ci/check-ai-governance.mjs',
      'scripts/ci/check-maintainability-budgets.mjs',
    ]);
  });
});
