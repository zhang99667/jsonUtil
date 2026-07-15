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
  assert.equal(report.counts.openFeedbackSignals, 1);
  assert.equal(report.counts.plannedExperimentTrials, 6);
  assert.equal(report.nextFocus.id, 'increase-outcome-coverage');
  assert.deepEqual(report.nextFocus.caseIds, [
    'rule-read-before-write', 'rule-preserve-dirty-worktree', 'rule-project-ai-asset-ownership',
  ]);
  assert.equal(report.learning.nextFocus.id, 'continue-repository-behavior-coverage');
  assert.equal(report.learning.nextFocus.status, 'actionable');
  assert.deepEqual(report.learning.nextFocus.caseIds, report.nextFocus.caseIds);
  assert.notDeepEqual(report.learning.nextFocus, report.learning.blockedFocus);
  assert.equal(report.blockedFocus.id, 'provision-protected-attested-verifier-launcher');
  assert.equal(report.blockedFocus.status, 'blocked');
  assert.equal(report.blockedFocus.blockingScope, 'external-provisioning');
  assert.equal(report.blockedFocus.caseIds[0], 'codex-external-controller-seatbelt-sentinel-boundary');
  assert.equal(report.blockedFocus.caseIds[1], 'codex-external-controller-attested-runtime-preflight-boundary');
  assert.equal(report.counts.unverifiedOutcomes, 0);
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
