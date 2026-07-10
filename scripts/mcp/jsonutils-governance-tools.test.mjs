import assert from 'node:assert/strict';
import { test } from 'node:test';

import { callJsonutilsGovernanceTool } from './jsonutils-governance-tools.mjs';

test('MCP tools run fixed budget report command with bounded top', async () => {
  const calls = [];
  const response = await callJsonutilsGovernanceTool(
    'maintainability_budget_report',
    { top: 999 },
    async (script, args) => {
      calls.push([script, args]);
      return { exitCode: 0, stdout: '{"ok":true}', stderr: '' };
    },
  );

  assert.equal(response.content[0].text, '{"ok":true}');
  assert.deepEqual(calls, [[
    'scripts/ci/check-maintainability-budgets.mjs',
    ['--json', '--no-all', '--top', '50'],
  ]]);
});

test('MCP tools run fixed artifact freshness command', async () => {
  const calls = [];
  const response = await callJsonutilsGovernanceTool(
    'ai_governance_artifact_freshness',
    {},
    async (script, args) => {
      calls.push([script, args]);
      return { exitCode: 0, stdout: '{"reportType":"ai-governance-artifact-freshness","ok":true}', stderr: '' };
    },
  );

  assert.match(response.content[0].text, /ai-governance-artifact-freshness/);
  assert.deepEqual(calls, [['scripts/ci/write-ai-governance-artifacts.mjs', ['--check', '--json']]]);
});

test('MCP tools return scorecard through fixed governance commands', async () => {
  const calls = [];
  const response = await callJsonutilsGovernanceTool(
    'ai_governance_scorecard',
    { top: 999 },
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
  const scorecard = JSON.parse(response.content[0].text);
  assert.equal(scorecard.reportType, 'jsonutils-governance-scorecard');
  assert.equal(scorecard.maturityScorecard.reportType, 'ai-governance-maturity-scorecard');
  assert.deepEqual(calls, [
    ['scripts/ci/check-ai-governance.mjs', ['--json']],
    ['scripts/ci/check-maintainability-budgets.mjs', ['--json', '--no-all', '--top', '50']],
  ]);
});
