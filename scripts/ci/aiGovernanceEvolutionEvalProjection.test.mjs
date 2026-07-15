import assert from 'node:assert/strict';
import { test } from 'node:test';

import { buildEvolutionEvalProjection } from './aiGovernanceEvolutionEvalProjection.mjs';

const buildFixture = () => {
  const corpusCoverage = { coverageClass: { total: 6, behavior: 4, componentBoundary: 2 } };
  const ledgerIntegrity = { status: 'pass', failures: [] };
  const ledgerChain = { status: 'pass', chainedOutcomes: 2, openFeedback: 1, resolvedFeedback: 1 };
  const evidenceFreshness = { status: 'fresh', staleOutcomeIds: [], staleCaseIds: [], failures: [] };
  const contractFailures = [];
  const currentRunFailures = [];
  const currentRunIssues = [];
  const componentBoundaryCaseIds = ['z-component', 'a-component'];
  const activeLatestOutcomes = [
    { id: 'z-score', caseId: 'z-case', schemaVersion: 3, verdict: 'pass', provenance: { method: 'deterministic' } },
    { id: 'a-trace', caseId: 'a-case', schemaVersion: 3, verdict: 'pass', provenance: { method: 'model' } },
    { id: 'm-unverified', caseId: 'm-case', schemaVersion: 3, verdict: 'partial', provenance: { method: 'model' } },
    { id: 'q-generic', caseId: 'q-case', schemaVersion: 3, verdict: 'fail', provenance: { method: 'human' } },
  ];
  return {
    input: {
      corpusResult: { cases: Array.from({ length: 6 }, () => ({})), coverage: corpusCoverage },
      behaviorCaseIds: new Set(['z-case', 'a-case', 'm-case', 'q-case']),
      componentBoundaryCaseIds,
      receiptResult: { receipts: [{}, {}, {}], validReceipts: [{}, {}], invalidReceiptCount: 1 },
      outcomeResult: {
        outcomes: Array.from({ length: 7 }, () => ({})),
        validOutcomes: Array.from({ length: 6 }, () => ({})),
        invalidOutcomeCount: 1,
        ledgerChain,
      },
      history: {
        activeLatestOutcomes,
        legacyOutcomes: [{}],
        staleOutcomes: [{}],
        retiredOutcomes: [{}],
        supersededOutcomes: 2,
        invalidOutcomes: 1,
      },
      replay: {
        verifiedOutcomeIds: new Set(['z-score']),
        currentRunVerifiedOutcomeIds: new Set(['m-unverified', 'z-score']),
        evidenceFreshness,
      },
      currentRunFailures,
      currentRunIssues,
      traceVerification: {
        traceBoundOutcomeIds: new Set(['a-trace', 'm-unverified']),
        verifiedOutcomeIds: new Set(['a-trace']),
        unverifiedOutcomeIds: new Set(['m-unverified']),
        registry: { trustedSigners: 1, signatureVerificationKeys: 2, trustedAdapters: 3, policies: 4 },
      },
      policyRegistry: {
        policiesByCaseId: new Map([
          ['m-case', {}], ['z-component', {}], ['q-case', {}], ['z-case', {}],
        ]),
      },
      contractFailures,
      ledgerIntegrity,
    },
    references: {
      corpusCoverage,
      ledgerIntegrity,
      ledgerChain,
      evidenceFreshness,
      contractFailures,
      currentRunFailures,
      currentRunIssues,
      componentBoundaryCaseIds,
    },
  };
};

test('eval projection 锁定机器 schema、引用身份与非字典序 ID', () => {
  const { input, references } = buildFixture();
  const report = buildEvolutionEvalProjection(input);

  assert.deepEqual(Object.keys(report), [
    'schemaVersion', 'reportType', 'ok', 'counts', 'coverage', 'failures',
    'contractFailures', 'currentRunFailures', 'currentRunIssues', 'evidenceFreshness',
    'ledgerIntegrity', 'ledgerChain', 'traceVerification', 'nextFocus', 'scoredOutcomeIds',
    'fixedReplayVerifiedOutcomeIds', 'currentRunVerifiedOutcomeIds', 'traceVerifiedOutcomeIds',
    'traceBoundOutcomeIds', 'unverifiedOutcomeIds',
  ]);
  assert.deepEqual(Object.keys(report.counts), [
    'cases', 'behaviorCases', 'componentBoundaryCases', 'outcomes', 'totalOutcomes',
    'validOutcomes', 'activeLatestOutcomes', 'recordedActiveOutcomes',
    'fixedReplayVerifiedOutcomes', 'currentRunVerifiedOutcomes', 'evidenceFreshnessFailures',
    'traceBoundOutcomes', 'traceVerifiedOutcomes', 'traceBoundUnverifiedOutcomes',
    'unverifiedOutcomes', 'legacyOutcomes', 'staleOutcomes', 'retiredOutcomes',
    'supersededOutcomes', 'historyOutcomes', 'invalidOutcomes', 'trialReceipts',
    'validTrialReceipts', 'invalidTrialReceipts', 'chainedOutcomes', 'openFeedback',
    'resolvedFeedback', 'pass', 'partial', 'fail', 'unverifiedPass', 'unverifiedPartial',
    'unverifiedFail', 'coveredCases', 'uncoveredCases', 'failures',
    'currentRunBehaviorFailures', 'currentRunComponentFailures', 'currentRunDeliveryBlocked', 'currentRunInfrastructureInvalid',
  ]);
  assert.deepEqual(Object.keys(report.coverage), ['corpus', 'outcomes']);
  assert.deepEqual(Object.keys(report.coverage.outcomes), [
    'coveredCases', 'totalCases', 'percent', 'uncoveredCaseIds', 'excluded',
    'activeLatestOutcomes', 'staleOutcomes', 'retiredOutcomes',
  ]);
  assert.deepEqual(Object.keys(report.traceVerification), [
    'status', 'trustedSigners', 'signatureVerificationKeys', 'trustedAdapters', 'policies', 'policyCaseIds',
  ]);

  assert.strictEqual(report.coverage.corpus, references.corpusCoverage);
  assert.strictEqual(report.coverage.outcomes.excluded.caseIds, references.componentBoundaryCaseIds);
  assert.strictEqual(report.ledgerIntegrity, references.ledgerIntegrity);
  assert.strictEqual(report.ledgerChain, references.ledgerChain);
  assert.strictEqual(report.evidenceFreshness, references.evidenceFreshness);
  assert.strictEqual(report.contractFailures, references.contractFailures);
  assert.strictEqual(report.currentRunFailures, references.currentRunFailures);
  assert.strictEqual(report.currentRunIssues, references.currentRunIssues);
  assert.notStrictEqual(report.failures, references.contractFailures);

  assert.deepEqual(report.scoredOutcomeIds, ['z-score', 'a-trace']);
  assert.deepEqual(report.fixedReplayVerifiedOutcomeIds, ['z-score']);
  assert.deepEqual(report.currentRunVerifiedOutcomeIds, ['m-unverified', 'z-score']);
  assert.deepEqual(report.traceVerifiedOutcomeIds, ['a-trace']);
  assert.deepEqual(report.traceBoundOutcomeIds, ['a-trace', 'm-unverified']);
  assert.deepEqual(report.unverifiedOutcomeIds, ['m-unverified', 'q-generic']);
  assert.deepEqual(report.coverage.outcomes.uncoveredCaseIds, ['m-case', 'q-case']);
  assert.deepEqual(report.traceVerification.policyCaseIds, ['m-case', 'q-case', 'z-case']);
  assert.deepEqual(report.nextFocus, {
    id: 'verify-agent-trace',
    nextAction: '为 trace-bound outcome 接入固定 policy 与可信 host adapter；验证前不计入行为分数',
    caseIds: ['m-case'],
  });
});

test('eval projection 保留 contract/current-run failure 顺序并独立处理 freshness', () => {
  const { input } = buildFixture();
  input.contractFailures = ['contract-failure', 'trace-failure'];
  input.currentRunFailures = ['current-run-failure'];
  input.currentRunIssues = [
    { failureClass: 'delivery-blocked' },
    { failureClass: 'behavior-fail' },
    { failureClass: 'component-fail' },
    { failureClass: 'infrastructure-invalid' },
  ];
  input.replay = {
    ...input.replay,
    evidenceFreshness: { status: 'stale', staleOutcomeIds: ['z-score'], staleCaseIds: ['z-case'], failures: ['freshness-failure'] },
  };
  const report = buildEvolutionEvalProjection(input);

  assert.deepEqual(report.failures, ['contract-failure', 'trace-failure', 'current-run-failure']);
  assert.equal(report.counts.failures, 3);
  assert.equal(report.counts.evidenceFreshnessFailures, 1);
  assert.deepEqual([
    report.counts.currentRunBehaviorFailures,
    report.counts.currentRunComponentFailures,
    report.counts.currentRunDeliveryBlocked,
    report.counts.currentRunInfrastructureInvalid,
  ], [1, 1, 1, 1]);
  assert.equal(report.ok, false);
  assert.equal(report.nextFocus.id, 'repair-eval-contract');
  assert.equal(report.failures.includes('freshness-failure'), false);

  input.contractFailures = [];
  input.currentRunFailures = [];
  input.currentRunIssues = [];
  const freshnessOnly = buildEvolutionEvalProjection(input);
  assert.deepEqual(freshnessOnly.failures, []);
  assert.equal(freshnessOnly.counts.failures, 0);
  assert.equal(freshnessOnly.counts.evidenceFreshnessFailures, 1);
  assert.equal(freshnessOnly.ok, false);
  assert.equal(freshnessOnly.nextFocus.id, 'refresh-stale-deterministic-evidence');
});
