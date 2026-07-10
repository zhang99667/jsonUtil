import assert from 'node:assert/strict';
import { test } from 'node:test';

import { callJsonutilsGovernanceTool } from './jsonutils-governance-tools.mjs';

test('governance report tool returns full-context scorecard focus', async () => {
  const calls = [];
  const response = await callJsonutilsGovernanceTool(
    'ai_governance_report',
    { top: 8 },
    async (script, args) => {
      calls.push([script, args]);
      const stdout = script.includes('check-ai-governance')
        ? JSON.stringify({
          reportType: 'ai-governance',
          ok: true,
          counts: { requiredFiles: 1, referenceRules: 1 },
          failures: { missingFiles: [], skillContractFailures: [], contractFailures: [], missingReferences: [] },
        })
        : JSON.stringify({ ok: true, items: { highUsage: [] } });
      return { exitCode: 0, stdout, stderr: '' };
    },
  );

  const report = JSON.parse(response.content[0].text);
  assert.equal(report.reportType, 'ai-governance');
  assert.equal(report.maturityScorecard.status, 'pass');
  assert.equal(report.maturityScorecard.nextFocus, null);
  assert.deepEqual(calls, [
    ['scripts/ci/check-ai-governance.mjs', ['--json']],
    ['scripts/ci/check-maintainability-budgets.mjs', ['--json', '--no-all', '--top', '8']],
  ]);
});
