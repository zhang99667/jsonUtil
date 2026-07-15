import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildRecentScoredOutcomeSummary } from './jsonutils-governance-evaluation-outcomes.mjs';

test('MCP v3 recent outcome 投影保留链字段、验证方法且 limit 只裁剪展示', () => {
  const outcomes = [1, 2].map(sequence => ({
    schemaVersion: 3, id: `v3-${sequence}`, caseId: 'chain-case', corpusVersion: '1.3.0', caseVersion: 1,
    subjectVersion: '1.0.0', evaluatedAt: '2026-07-11', verdict: 'pass', score: 100,
    provenance: { method: 'deterministic', source: 'local', trials: 1 }, writeback: { validationResults: [] },
    chain: { sequence }, supersession: { previousOutcomeId: sequence === 1 ? null : 'v3-1', feedbackDisposition: 'none' },
  }));
  const summary = buildRecentScoredOutcomeSummary({
    outcomes,
    scoredOutcomeIds: new Set(['v3-1', 'v3-2']),
    fixedReplayOutcomeIds: new Set(['v3-1']),
    traceVerifiedOutcomeIds: new Set(['v3-2']),
    limit: 1,
  });
  assert.equal(summary.truncated, true);
  assert.deepEqual(
    Object.fromEntries(['ledgerSequence', 'previousOutcomeId', 'feedbackDisposition'].map(key => [key, summary.recentOutcomes[0][key]])),
    { ledgerSequence: 2, previousOutcomeId: 'v3-1', feedbackDisposition: 'none' },
  );
  assert.equal(summary.recentOutcomes[0].verificationMethod, 'agent-trace');
  assert.equal('events' in summary.recentOutcomes[0], false);
});
