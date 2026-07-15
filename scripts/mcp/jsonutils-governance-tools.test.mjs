import assert from 'node:assert/strict';
import path from 'node:path';
import { test } from 'node:test';
import { readEvolutionEvalCorpus } from '../ci/aiGovernanceEvolutionEvalContract.mjs';
import { callJsonutilsGovernanceTool } from './jsonutils-governance-tools.mjs';
import { executeJsonutilsGovernanceToolRuntime } from './jsonutils-governance-tool-runtime.mjs';
import { MAX_TOOL_WORKER_OUTPUT_BYTES } from './jsonutils-governance-tool-worker-contract.mjs';

test('MCP controller delegates a closed request and AbortSignal to the fresh worker', async () => {
  const calls = [];
  const controller = new AbortController();
  const expected = { content: [{ type: 'text', text: '{}' }], structuredContent: {}, isError: false };
  const response = await callJsonutilsGovernanceTool(
    'ai_asset_inventory',
    { limit: 3 },
    async (request, options) => { calls.push([request, options.signal]); return expected; },
    { signal: controller.signal },
  );

  assert.equal(response, expected);
  assert.deepEqual(calls, [[{ name: 'ai_asset_inventory', args: { limit: 3 } }, controller.signal]]);
});

test('fresh worker completes the largest fixed report envelopes within its output bound', async () => {
  for (const [name, args] of [
    ['ai_governance_report', { top: 35 }],
    ['maintainability_budget_report', { top: 35 }],
  ]) {
    const response = await callJsonutilsGovernanceTool(name, args);
    assert.equal(typeof response.structuredContent, 'object');
    assert.ok(Buffer.byteLength(response.content[0].text) < MAX_TOOL_WORKER_OUTPUT_BYTES);
  }
});

test('MCP tools run fixed budget report command with declared top', async () => {
  const calls = [];
  const controller = new AbortController();
  const response = await executeJsonutilsGovernanceToolRuntime(
    'maintainability_budget_report',
    { top: 50 },
    async (script, args, options) => {
      calls.push([script, args, options.signal]);
      return { exitCode: 0, stdout: '{"ok":true}', stderr: '' };
    },
    { signal: controller.signal },
  );

  assert.deepEqual(response, { content: [{ type: 'text', text: '{"ok":true}' }], isError: false, structuredContent: { ok: true } });
  assert.deepEqual(calls, [[
    'scripts/ci/check-maintainability-budgets.mjs',
    ['--json', '--no-all', '--top', '50'],
    controller.signal,
  ]]);
});

test('MCP tools keep text errors when fixed artifact JSON cannot be parsed', async () => {
  const calls = [];
  const response = await executeJsonutilsGovernanceToolRuntime(
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
  const response = await executeJsonutilsGovernanceToolRuntime('ai_evaluation_summary', { limit: 50 });
  const corpus = readEvolutionEvalCorpus(path.resolve(import.meta.dirname, '../../evals/ai-governance/cases.json'));
  assert.deepEqual(corpus.failures, []);
  assert.equal(response.structuredContent.reportType, 'jsonutils-evaluation-summary');
  assert.equal(response.structuredContent.counts.cases, corpus.cases.length);
  assert.equal(response.structuredContent.counts.behaviorCases, corpus.cases.filter(item => item.coverageClass === 'behavior').length);
  assert.equal(response.structuredContent.counts.componentBoundaryCases, corpus.cases.filter(item => item.coverageClass === 'component-boundary').length);
  assert.equal(response.structuredContent.learning.counts.openFeedbackSignals, 2);
  assert.equal(response.structuredContent.learning.experiments[0].plannedTrials, 6);
  assert.equal(response.structuredContent.learning.experiments[1].status, 'prepared');
  assert.ok(response.structuredContent.recentOutcomes.length <= 50);
  assert.deepEqual(JSON.parse(response.content[0].text), response.structuredContent);
});

test('MCP tools return scorecard through fixed governance commands', async () => {
  const calls = [];
  const response = await executeJsonutilsGovernanceToolRuntime(
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
