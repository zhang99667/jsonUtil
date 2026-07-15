import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  buildJsonutilsEvaluationSummaryProjection,
  normalizeJsonutilsEvaluationSummaryLimit,
} from './jsonutils-governance-evaluation-projection.mjs';

const buildReport = () => ({
  ok: true,
  counts: { cases: 38 },
  coverage: { outcomes: { percent: 0 } },
  ledgerIntegrity: { status: 'unknown' },
  ledgerChain: { status: 'pass' },
  traceVerification: { status: 'policy-ready' },
  nextFocus: { id: 'refresh-stale-deterministic-evidence' },
  contractFailures: [],
  currentRunFailures: [],
  currentRunIssues: [],
  evidenceFreshness: { status: 'stale' },
  graderHealth: { ok: true },
  blockedFocus: { id: 'provision-protected-attested-verifier-launcher' },
  learning: {
    schemaVersion: 1,
    counts: { feedbackSignals: 3 },
    blockedFocus: { blockingScope: 'external-provisioning' },
    nextFocus: { reasonCode: 'external-execution-required' },
    openSignalIds: ['signal-1', 'signal-2', 'signal-3'],
    experiments: [{ id: 'experiment-1' }, { id: 'experiment-2' }],
    failures: [],
  },
});

test('evaluation projection 将非法和越界 limit 归一化到固定范围', () => {
  assert.deepEqual(
    [undefined, 0, 7, 51, 1.5].map(normalizeJsonutilsEvaluationSummaryLimit),
    [10, 1, 7, 50, 10],
  );
});

test('evaluation projection 只裁剪 learning 与 outcome 展示，不改全局事实', () => {
  const report = buildReport();
  const outcomeSummary = { recentOutcomes: [{ id: 'outcome-1' }], truncated: true };
  const narrow = buildJsonutilsEvaluationSummaryProjection({ report, outcomeSummary, limit: 1 });
  const wide = buildJsonutilsEvaluationSummaryProjection({ report, outcomeSummary, limit: 50 });

  assert.deepEqual(Object.keys(narrow), [
    'schemaVersion', 'reportType', 'ok', 'counts', 'coverage', 'ledgerIntegrity', 'ledgerChain',
    'traceVerification', 'nextFocus', 'contractFailures', 'currentRunFailures', 'currentRunIssues',
    'evidenceFreshness', 'graderHealth', 'blockedFocus', 'learning', 'recentOutcomes',
    'recentOutcomesScope', 'truncated',
  ]);
  for (const key of ['ok', 'counts', 'coverage', 'ledgerIntegrity', 'ledgerChain', 'traceVerification',
    'nextFocus', 'contractFailures', 'currentRunFailures', 'currentRunIssues', 'evidenceFreshness',
    'graderHealth', 'blockedFocus']) assert.strictEqual(narrow[key], report[key]);
  assert.strictEqual(narrow.learning.counts, report.learning.counts);
  assert.strictEqual(narrow.learning.blockedFocus, report.learning.blockedFocus);
  assert.strictEqual(narrow.learning.nextFocus, report.learning.nextFocus);
  assert.deepEqual(narrow.learning.openSignalIds, ['signal-1']);
  assert.deepEqual(narrow.learning.experiments, [{ id: 'experiment-1' }]);
  assert.equal(narrow.learning.truncated, true);
  assert.deepEqual(wide.learning.openSignalIds, report.learning.openSignalIds);
  assert.deepEqual(wide.learning.experiments, report.learning.experiments);
  assert.equal(wide.learning.truncated, false);
  assert.strictEqual(narrow.recentOutcomes, outcomeSummary.recentOutcomes);
  assert.equal(narrow.recentOutcomesScope, 'verified-v2-v3');
  assert.equal(narrow.truncated, true);
});
