import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';

import { buildAiGovernanceEvolutionSuiteReport } from './aiGovernanceEvolutionSuiteReport.mjs';

const rootDir = path.resolve(import.meta.dirname, '../..');

test('suite report 保留真实 external blocker，同时把仓内可执行项作为 nextFocus', () => {
  const report = buildAiGovernanceEvolutionSuiteReport({
    rootDir,
    replayDeterministic: ({ outcomes }) => ({ verifiedOutcomeIds: new Set(outcomes.map(item => item.id)), failures: [] }),
  });
  assert.equal(report.learning.ok, true);
  assert.equal(report.counts.openFeedbackSignals, 2);
  assert.equal(report.counts.plannedExperimentTrials, 12);
  assert.equal(report.nextFocus.id, 'prepare-behavior-evidence-channel');
  assert.deepEqual(report.nextFocus.caseIds, ['skill-jsonutils-ai-infra-evolver-trigger']);
  assert.strictEqual(report.nextFocus, report.learning.nextFocus);
  assert.strictEqual(report.blockedFocus, report.learning.blockedFocus);
  assert.equal(report.learning.nextFocus.id, 'prepare-behavior-evidence-channel');
  assert.equal(report.learning.nextFocus.status, 'preparation-required'); assert.equal(report.learning.nextFocus.reasonCode, 'external-execution-required'); assert.equal(report.learning.nextFocus.executionStatus, 'prepared'); assert.equal(report.learning.nextFocus.ingestionStatus, 'unavailable');
  assert.deepEqual(report.learning.nextFocus.caseIds, report.nextFocus.caseIds);
  assert.notDeepEqual(report.learning.nextFocus, report.learning.blockedFocus);
  assert.equal(report.blockedFocus.id, 'provision-protected-attested-verifier-launcher');
  assert.equal(report.blockedFocus.status, 'blocked');
  assert.equal(report.blockedFocus.blockingScope, 'external-provisioning');
  assert.equal(report.blockedFocus.caseIds[0], 'codex-external-controller-seatbelt-sentinel-boundary');
  assert.equal(report.blockedFocus.caseIds[1], 'codex-external-controller-attested-runtime-preflight-boundary');
  assert.equal(report.counts.unverifiedOutcomes, 0);
});

test('suite report 将 current runner 通过但 revision drift 单列为证据刷新', () => {
  const replayDeterministic = ({ outcomes }) => ({ verifiedOutcomeIds: new Set(), failures: [],
    currentRunVerifiedOutcomeIds: new Set(outcomes.map(item => item.id)),
    evidenceFreshness: { status: 'stale', staleOutcomeIds: outcomes.map(item => item.id),
      staleCaseIds: [...new Set(outcomes.map(item => item.caseId))], failures: outcomes.map(item => `outcome ${item.id} revision stale`) } });
  const report = buildAiGovernanceEvolutionSuiteReport({ rootDir, replayDeterministic });
  assert.equal(report.ok, false); assert.deepEqual(report.contractFailures, []);
  assert.deepEqual(report.currentRunFailures, []); assert.equal(report.nextFocus.id, 'refresh-stale-deterministic-evidence');
  assert.equal(report.counts.currentRunVerifiedOutcomes, 1); assert.equal(report.counts.evidenceFreshnessFailures, 1);
});

test('suite report 对缺失 learning 资产 fail closed', () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'jsonutils-suite-'));
  try {
    const evalDir = path.join(tempRoot, 'evals/ai-governance');
    fs.mkdirSync(evalDir, { recursive: true });
    for (const file of ['cases.json', 'outcomes.jsonl', 'trial-receipts.jsonl', 'trace-policies.json']) {
      fs.copyFileSync(path.join(rootDir, 'evals/ai-governance', file), path.join(evalDir, file));
    }
    const report = buildAiGovernanceEvolutionSuiteReport({ rootDir: tempRoot });
    assert.equal(report.ok, false);
    assert.equal(report.nextFocus.id, 'fix-learning-contract');
    assert.equal(report.blockedFocus, null);
    assert.match(report.failures.join('\n'), /feedback-inbox|experiments/);
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});
