import assert from 'node:assert/strict';
import { test } from 'node:test';
import { callJsonutilsGovernanceTool } from './jsonutils-governance-tools.mjs';

test('MCP tools run fixed budget report command with declared top', async () => {
  const calls = [];
  const response = await callJsonutilsGovernanceTool(
    'maintainability_budget_report',
    { top: 50 },
    async (script, args) => {
      calls.push([script, args]);
      return { exitCode: 0, stdout: '{"ok":true}', stderr: '' };
    },
  );

  assert.deepEqual(response, { content: [{ type: 'text', text: '{"ok":true}' }], isError: false, structuredContent: { ok: true } });
  assert.deepEqual(calls, [[
    'scripts/ci/check-maintainability-budgets.mjs',
    ['--json', '--no-all', '--top', '50'],
  ]]);
});

test('MCP tools keep text errors when fixed artifact JSON cannot be parsed', async () => {
  const calls = [];
  const response = await callJsonutilsGovernanceTool(
    'ai_governance_artifact_freshness',
    {},
    async (script, args) => {
      calls.push([script, args]);
      return { exitCode: 1, stdout: 'not-json', stderr: 'artifact check failed' };
    },
  );

  assert.deepEqual(response, { content: [{ type: 'text', text: 'not-json\nartifact check failed' }], isError: true });
  assert.deepEqual(calls, [['scripts/ci/write-ai-governance-artifacts.mjs', ['--check', '--json']]]);
});

test('MCP tools return bounded structured evaluation summary', async () => {
  const response = await callJsonutilsGovernanceTool('ai_evaluation_summary', { limit: 50 });
  assert.equal(response.structuredContent.reportType, 'jsonutils-evaluation-summary');
  assert.equal(response.structuredContent.counts.cases, 34);
  assert.equal(response.structuredContent.counts.behaviorCases, 18);
  assert.equal(response.structuredContent.counts.componentBoundaryCases, 16);
  assert.equal(response.structuredContent.learning.counts.openFeedbackSignals, 1);
  assert.equal(response.structuredContent.learning.experiments[0].plannedTrials, 6);
  assert.ok(response.structuredContent.recentOutcomes.length <= 50);
  assert.deepEqual(JSON.parse(response.content[0].text), response.structuredContent);
});

test('MCP tools return scorecard through fixed governance commands', async () => {
  const calls = [];
  const response = await callJsonutilsGovernanceTool(
    'ai_governance_scorecard',
    { top: 50 },
    async (script, args) => {
      calls.push([script, args]);
      const stdout = script.includes('check-ai-governance')
        ? JSON.stringify({
          ok: true,
          counts: { requiredFiles: 1, referenceRules: 1 },
          failures: { missingFiles: [], skillContractFailures: [], contractFailures: [], missingReferences: [] },
        })
        : JSON.stringify({ ok: true, items: { highUsage: [] } });
      return { exitCode: 0, stdout, stderr: '' };
    },
  );
  const scorecard = response.structuredContent;
  assert.deepEqual(JSON.parse(response.content[0].text), scorecard);
  assert.equal(scorecard.reportType, 'jsonutils-governance-scorecard');
  assert.equal(scorecard.maturityScorecard.reportType, 'ai-governance-maturity-scorecard');
  assert.deepEqual(calls, [
    ['scripts/ci/check-ai-governance.mjs', ['--json']],
    ['scripts/ci/check-maintainability-budgets.mjs', ['--json', '--no-all', '--top', '50']],
  ]);
});
