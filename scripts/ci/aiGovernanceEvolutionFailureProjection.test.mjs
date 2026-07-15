import assert from 'node:assert/strict';
import path from 'node:path';
import { test } from 'node:test';

import { buildAiGovernanceEvolutionSuiteReport } from './aiGovernanceEvolutionSuiteReport.mjs';
import { buildAiGovernanceMaturityScorecard } from './aiGovernanceMaturityScorecard.mjs';

const rootDir = path.resolve(import.meta.dirname, '../..');

const buildSuite = (failureClass, reasonCode) => buildAiGovernanceEvolutionSuiteReport({
  rootDir,
  replayDeterministic: () => ({
    verifiedOutcomeIds: new Set(),
    currentRunVerifiedOutcomeIds: new Set(),
    failures: [`fixed runner: ${reasonCode}`],
    currentRunIssues: [{
      caseId: 'rule-project-ai-asset-ownership',
      outcomeId: 'fixture-outcome',
      failureClass,
      reasonCode,
      diagnostic: `fixed runner command failed: ${reasonCode}`,
    }],
    evidenceFreshness: { status: 'current', staleOutcomeIds: [], staleCaseIds: [], failures: [] },
  }),
});

const behaviorDimension = report => buildAiGovernanceMaturityScorecard({
  governanceReport: {
    counts: { requiredFiles: 1, referenceRules: 1 },
    failures: { missingFiles: [], missingReferences: [], skillContractFailures: [], contractFailures: [] },
    evolutionEvals: report,
  },
  budgetReport: { ok: true, items: { highUsage: [] } },
}).dimensions.find(item => item.id === 'behavior-quality');

test('delivery-blocked 保持执行失败但不计 behavior failure', () => {
  const report = buildSuite('delivery-blocked', 'distribution-index-not-ready');
  assert.equal(report.ok, false);
  assert.equal(report.counts.currentRunDeliveryBlocked, 1);
  assert.equal(report.counts.currentRunInfrastructureInvalid, 0);
  assert.equal(report.counts.currentRunBehaviorFailures, 0);
  assert.equal(report.currentRunIssues[0].failureClass, 'delivery-blocked');
  assert.equal(report.nextFocus.id, 'complete-project-delivery-evidence');
  assert.equal(behaviorDimension(report).status, 'warn');
});

test('infrastructure-invalid 不计 behavior failure 且行为维度保持 unknown', () => {
  const report = buildSuite('infrastructure-invalid', 'fixed-runner-timeout');
  assert.equal(report.counts.currentRunInfrastructureInvalid, 1);
  assert.equal(report.counts.currentRunBehaviorFailures, 0);
  assert.equal(report.nextFocus.id, 'repair-fixed-runner-infrastructure');
  assert.equal(behaviorDimension(report).status, 'unknown');
});

test('component-fail 单独计数且不污染 behavior failure', () => {
  const report = buildSuite('component-fail', 'fixed-component-assertion-failed');
  assert.equal(report.counts.currentRunComponentFailures, 1);
  assert.equal(report.counts.currentRunBehaviorFailures, 0);
  assert.equal(report.nextFocus.id, 'repair-current-component-run');
  assert.equal(behaviorDimension(report).status, 'unknown');
});

test('只有 behavior-fail 将行为维度标为 fail', () => {
  const report = buildSuite('behavior-fail', 'fixed-command-assertion-failed');
  assert.equal(report.counts.currentRunBehaviorFailures, 1);
  assert.equal(report.counts.currentRunComponentFailures, 0);
  assert.equal(report.counts.currentRunDeliveryBlocked, 0);
  assert.equal(report.counts.currentRunInfrastructureInvalid, 0);
  assert.equal(report.nextFocus.id, 'repair-current-deterministic-run');
  assert.equal(behaviorDimension(report).status, 'fail');
});
