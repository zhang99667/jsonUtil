import assert from 'node:assert/strict';
import { test } from 'node:test';
import { executeJsonutilsGovernanceToolRuntime } from './jsonutils-governance-tool-runtime.mjs';

const READY_SCOPE = { ok: true, counts: { assets: 1, failures: 0 }, failureSample: [], truncated: false };
const DISTRIBUTION_READINESS = {
  schemaVersion: 1, reportType: 'ai-asset-distribution-readiness', ok: true,
  stability: { status: 'stable', sourceDrift: 0, gitInventoryDrift: 0, sourceReadErrors: 0, gitInventoryErrors: 0 },
  counts: { assets: 1, failedScopes: 0 }, readiness: { workspaceCandidate: true, nextCommit: true, clone: true },
  scopes: { workspace: READY_SCOPE, index: READY_SCOPE, head: READY_SCOPE },
};
const callReport = async (governanceOk, budgetOk, calls = []) => executeJsonutilsGovernanceToolRuntime(
  'ai_governance_report', { top: 8 }, async (script, args) => {
    calls.push([script, args]);
    const stdout = script.includes('check-ai-governance')
      ? JSON.stringify({ reportType: 'ai-governance', ok: governanceOk, counts: { requiredFiles: 1, referenceRules: 1 }, failures: { missingFiles: [], skillContractFailures: [], contractFailures: [], missingReferences: [] }, distributionReadiness: DISTRIBUTION_READINESS })
      : JSON.stringify({ ok: budgetOk, counts: { budgets: 1 }, items: { highUsage: [] } });
    return { exitCode: Number(!JSON.parse(stdout).ok), stdout, stderr: '' };
  },
);
test('governance report tool returns full-context scorecard focus', async () => {
  const calls = [];
  const response = await callReport(true, true, calls);
  const report = response.structuredContent;
  assert.deepEqual(JSON.parse(response.content[0].text), report);
  assert.deepEqual([report.ok, response.isError], [true, false]);
  assert.equal(report.reportType, 'ai-governance');
  assert.equal(report.maturityScorecard.nextFocus.id, 'behavior-quality');
  assert.deepEqual(report.distributionReadiness, DISTRIBUTION_READINESS);
  assert.equal(report.maturityScorecard.dimensions.find(item => item.id === 'distribution-readiness').status, 'pass');
  assert.deepEqual(calls, [
    ['scripts/ci/check-ai-governance.mjs', ['--json']], ['scripts/ci/check-maintainability-budgets.mjs', ['--json', '--no-all', '--top', '8']],
  ]);
});
test('governance report tool combines both source statuses without hiding either failure', async () => {
  for (const [governanceOk, budgetOk] of [[true, false], [false, true]]) {
    const response = await callReport(governanceOk, budgetOk);
    const report = response.structuredContent;
    assert.deepEqual(JSON.parse(response.content[0].text), report);
    assert.equal(report.ok, false);
    assert.equal(response.isError, !report.ok);
    assert.equal(report.governance.ok, governanceOk);
    assert.equal(report.maintainability.ok, budgetOk);
  }
});
