import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';

import { readEvolutionEvalCorpus } from './aiGovernanceEvolutionEvalContract.mjs';
import { readEvolutionExperiments } from './aiGovernanceEvolutionExperiments.mjs';
import { buildEvolutionLearningReport } from './aiGovernanceEvolutionLearningReport.mjs';

const rootDir = path.resolve(import.meta.dirname, '../..');
const manifestPath = path.join(rootDir, 'evals/ai-governance/experiments.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const corpus = readEvolutionEvalCorpus(path.join(rootDir, 'evals/ai-governance/cases.json'), { maxDate: '2026-07-13' });
const casesById = new Map(corpus.cases.map(item => [item.id, item]));

const withManifest = (value, run) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'jsonutils-experiments-'));
  const filePath = path.join(dir, 'experiments.json');
  try {
    fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
    return run(filePath);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
};

test('experiment manifest 锁定 paired A/B、三 repetitions、split 与 unavailable metrics', () => {
  const report = readEvolutionExperiments(manifestPath, { casesById, maxDate: '2026-07-13' });
  assert.deepEqual(report.failures, []);
  const experiment = report.experiments[0];
  assert.equal(experiment.design.trialPlan.length, 6);
  assert.equal(experiment.execution.status, 'blocked');
  assert.equal(experiment.metrics.pairedDelta.status, 'unavailable');
  assert.equal(experiment.design.blinding.candidateCanReadGrader, false);
});

test('experiment manifest 拒绝 split 泄漏、单 trial、假指标与 grader 泄漏', () => {
  for (const mutate of [
    value => value.experiments[0].design.splits.holdout.push('mcp-project-registration-discovery'),
    value => { value.experiments[0].design.repetitions = 1; },
    value => { value.experiments[0].metrics.cost = { status: 'available', value: 0 }; },
    value => { value.experiments[0].design.blinding.candidateCanReadGrader = true; },
  ]) {
    const value = structuredClone(manifest);
    mutate(value);
    withManifest(value, filePath => assert.notDeepEqual(
      readEvolutionExperiments(filePath, { casesById, maxDate: '2026-07-13' }).failures,
      [],
    ));
  }
});

test('learning report 组合真实 open signal 与 blocked canary，不生成 outcome', () => {
  const report = buildEvolutionLearningReport({ rootDir, maxDate: '2026-07-13' });
  assert.equal(report.ok, true);
  assert.deepEqual(report.counts, {
    feedbackEvents: 1, feedbackSignals: 1, openFeedbackSignals: 1,
    experiments: 1, plannedTrials: 6, executedTrials: 0,
  });
  assert.equal(report.nextFocus.id, 'continue-repository-behavior-coverage');
  assert.equal(report.nextFocus.status, 'actionable');
  assert.notDeepEqual(report.nextFocus, report.blockedFocus);
  assert.equal(report.blockedFocus.status, 'blocked');
  assert.equal(report.blockedFocus.blockingScope, 'external-provisioning');
  assert.deepEqual(report.blockedFocus.prerequisites, [
    'external-linux-admin-plane',
    'root-owned-digest-pinned-runtime',
    'non-caller-runtime-bindings',
    'external-signer-witness-state-authority',
    'zero-model-adversarial-preflight',
  ]);
  assert.deepEqual(report.nextFocus.caseIds, [
    'rule-read-before-write',
    'rule-preserve-dirty-worktree',
    'rule-project-ai-asset-ownership',
  ]);
  assert.deepEqual(report.blockedFocus.blockedCaseIds, [
    'mcp-project-registration-discovery', 'mcp-fixed-tool-selection',
  ]);
  assert.equal(report.experiments[0].metricsStatus, 'unavailable');
});

test('learning actionable focus 拒绝外部阻断与 component-only case', () => {
  const report = buildEvolutionLearningReport({
    rootDir,
    maxDate: '2026-07-13',
    actionableCaseIds: [
      'mcp-project-registration-discovery',
      'codex-external-controller-seatbelt-sentinel-boundary',
      'rule-read-before-write',
    ],
  });
  assert.deepEqual(report.nextFocus.caseIds, ['rule-read-before-write']);
});
