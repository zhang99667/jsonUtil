import assert from 'node:assert/strict';
import { test } from 'node:test';

import { buildJsonutilsHandoffBrief } from './jsonutils-governance-handoff.mjs';

const READY_SCOPE = { ok: true, counts: { assets: 4, failures: 0 }, failureSample: [], truncated: false };
const PENDING_SCOPE = { ok: false, counts: { assets: 4, failures: 2 }, failureSample: ['a.mjs: pending', 'b.mjs: pending'], truncated: false };
const DISTRIBUTION_READINESS = {
  schemaVersion: 1, reportType: 'ai-asset-distribution-readiness', ok: false,
  stability: { status: 'stable', sourceDrift: 0, gitInventoryDrift: 0, sourceReadErrors: 0, gitInventoryErrors: 0 },
  counts: { assets: 4, failedScopes: 2 }, readiness: { workspaceCandidate: true, nextCommit: false, clone: false },
  scopes: { workspace: READY_SCOPE, index: PENDING_SCOPE, head: PENDING_SCOPE },
};

test('handoff 复用治理报告的分发事实且不新增分发子命令', async () => {
  const calls = [];
  const brief = await buildJsonutilsHandoffBrief({
    runScript: async (script, args) => {
      calls.push([script, args]);
      const stdout = script.includes('check-ai-governance')
        ? JSON.stringify({
          ok: true, counts: { requiredFiles: 2, referenceRules: 1 },
          failures: { missingFiles: [], skillContractFailures: [], contractFailures: [], missingReferences: [] },
          distributionReadiness: DISTRIBUTION_READINESS,
        })
        : JSON.stringify({ ok: true, items: { highUsage: [] } });
      return { exitCode: 0, stdout, stderr: '' };
    },
    runStatus: async () => ({ exitCode: 0, stdout: Buffer.from('## main\0') }),
  });

  assert.deepEqual(brief.governance.distributionReadiness, DISTRIBUTION_READINESS);
  assert.equal(brief.governance.nextFocus.id, 'distribution-readiness');
  assert.deepEqual(brief.risks, [
    'Git index 尚有 2 个 AI 资产未进入下一提交',
    'HEAD 尚有 2 个 AI 资产当前版本不可由其他维护者 clone',
  ]);
  assert.deepEqual(calls.map(([script]) => script), [
    'scripts/ci/check-ai-governance.mjs',
    'scripts/ci/check-maintainability-budgets.mjs',
  ]);
  for (const scope of ['workspace', 'index', 'head']) {
    assert.ok(brief.nextCommands.includes(`node scripts/ci/check-ai-asset-distribution.mjs --${scope}`));
  }
});
