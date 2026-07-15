import assert from 'node:assert/strict';
import path from 'node:path';
import { test } from 'node:test';

import { buildEvolutionLearningReport } from './aiGovernanceEvolutionLearningReport.mjs';

const rootDir = path.resolve(import.meta.dirname, '../..');

test('learning report 组合真实 open signal 与 blocked canary，不生成 outcome', () => {
  const report = buildEvolutionLearningReport({ rootDir, maxDate: '2026-07-15',
    tracePolicyCaseIds: ['skill-jsonutils-ai-infra-evolver-trigger'] });
  assert.equal(report.ok, true);
  assert.deepEqual(report.counts, {
    feedbackEvents: 2, feedbackSignals: 2, openFeedbackSignals: 2,
    experiments: 2, plannedTrials: 12, executedTrials: 0,
  });
  assert.equal(report.nextFocus.id, 'prepare-behavior-evidence-channel');
  assert.equal(report.nextFocus.status, 'preparation-required');
  assert.equal(report.nextFocus.reasonCode, 'external-execution-required');
  assert.equal(report.nextFocus.executionStatus, 'prepared');
  assert.equal(report.nextFocus.ingestionStatus, 'unavailable');
  assert.equal(report.nextFocus.ingestionReasonCode, 'protected-assignment-trust-unavailable');
  assert.notDeepEqual(report.nextFocus, report.blockedFocus);
  assert.equal(report.blockedFocus.status, 'blocked');
  assert.equal(report.blockedFocus.blockingScope, 'external-provisioning');
  assert.deepEqual(report.blockedFocus.prerequisites, [
    'external-linux-admin-plane', 'root-owned-digest-pinned-runtime',
    'non-caller-runtime-bindings', 'external-signer-witness-state-authority',
    'zero-model-adversarial-preflight',
  ]);
  assert.deepEqual(report.nextFocus.caseIds, ['skill-jsonutils-ai-infra-evolver-trigger']);
  assert.deepEqual(report.nextFocus.caseChannels,
    [{ caseId: 'skill-jsonutils-ai-infra-evolver-trigger', status: 'preparation-required' }]);
  assert.deepEqual(report.blockedFocus.blockedCaseIds,
    ['mcp-project-registration-discovery', 'mcp-fixed-tool-selection']);
  assert.equal(report.blockedFocus.caseIds.includes('skill-jsonutils-ai-infra-evolver-trigger'), false);
  assert.equal(report.experiments[0].metricsStatus, 'unavailable');
  assert.equal(report.experiments[1].status, 'prepared');
  assert.equal(report.experiments[1].ingestionStatus, 'unavailable');
});

test('learning focus 只把 policy、paired experiment 与 ingestion 均 ready 的 behavior case 标为 actionable', () => {
  const report = buildEvolutionLearningReport({
    rootDir,
    maxDate: '2026-07-15',
    actionableCaseIds: [
      'mcp-project-registration-discovery', 'codex-external-controller-seatbelt-sentinel-boundary',
      'rule-read-before-write',
    ],
    tracePolicyCaseIds: ['rule-read-before-write'],
    trialReadyCaseIds: ['rule-read-before-write'],
  });
  assert.deepEqual(report.nextFocus.caseIds, ['rule-read-before-write']);
  assert.equal(report.nextFocus.status, 'actionable');
  assert.deepEqual(report.nextFocus.caseChannels, [
    { caseId: 'rule-read-before-write', status: 'fresh-task-observation-ready' }]);
});
