import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { withJsonutilsGovernanceMcpTempRoot } from '../ci/jsonutilsGovernanceMcpTestFixtures.mjs';
import { buildJsonutilsEvaluationSummary } from './jsonutils-governance-evaluations.mjs';

const projectRoot = path.resolve(import.meta.dirname, '../..');

const copyLearningAssets = (evalDir) => {
  ['feedback-inbox.jsonl', 'experiments.json'].forEach(file => (
    fs.copyFileSync(path.join(projectRoot, 'evals/ai-governance', file), path.join(evalDir, file))
  ));
  const fixture = '.agents/skills/jsonutils-ai-infra-evolver/evals/evals.json';
  const target = path.join(path.resolve(evalDir, '../..'), fixture);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(path.join(projectRoot, fixture), target);
};

test('MCP evaluation summary 将 legacy 与可评分 outcome 分层', () => withJsonutilsGovernanceMcpTempRoot((rootDir) => {
  const evalDir = path.join(rootDir, 'evals/ai-governance');
  fs.mkdirSync(evalDir, { recursive: true });
  fs.copyFileSync(path.join(projectRoot, 'evals/ai-governance/cases.json'), path.join(evalDir, 'cases.json'));
  copyLearningAssets(evalDir);
  const outcomes = [1, 2].map(index => ({
    schemaVersion: 1,
    id: `outcome-summary-${index}`,
    caseId: 'rule-read-before-write',
    corpusVersion: '1.0.0',
    caseVersion: 1,
    subjectVersion: '2026-07-10',
    evaluatedAt: '2026-07-10',
    verdict: 'pass',
    score: 100,
    provenance: { method: 'deterministic', source: 'local', runner: 'node-test', revision: `fixture-${index}`, trials: 1 },
    writeback: {
      files: [],
      validationResults: [{ command: 'node --test fixture', status: 'passed', evidence: 'fixture passed', checkedAt: '2026-07-10' }],
    },
  }));
  fs.writeFileSync(path.join(evalDir, 'outcomes.jsonl'), `${outcomes.map(JSON.stringify).join('\n')}\n`);
  fs.writeFileSync(path.join(evalDir, 'trial-receipts.jsonl'), '');

  const summary = buildJsonutilsEvaluationSummary({ rootDir, limit: 1, graderCalibrationRootDir: projectRoot });
  assert.equal(summary.schemaVersion, 3);
  assert.equal(Number.isInteger(summary.counts.currentRunComponentFailures), true);
  assert.equal(summary.reportType, 'jsonutils-evaluation-summary');
  assert.equal(summary.counts.totalOutcomes, 2);
  assert.equal(summary.counts.outcomes, 0);
  assert.equal(summary.counts.activeLatestOutcomes, 0);
  assert.equal(summary.counts.legacyOutcomes, 2);
  assert.equal(summary.ledgerIntegrity.status, 'not-applicable');
  assert.equal(summary.ledgerChain.status, 'legacy');
  assert.deepEqual(summary.traceVerification, {
    status: 'unavailable', trustedSigners: 0, signatureVerificationKeys: 0,
    trustedAdapters: 0, policies: 0, policyCaseIds: [],
  });
  assert.deepEqual(summary.recentOutcomes, []);
  assert.equal(summary.recentOutcomesScope, 'verified-v2-v3');
  assert.equal(summary.truncated, false);
  assert.deepEqual(summary.contractFailures, []);
  assert.equal(summary.graderHealth.ok, true);
  assert.equal(summary.graderHealth.claims.behaviorCoverageDelta, 0);
  assert.equal(summary.evidenceFreshness.status, 'not-applicable');
  assert.equal(summary.learning.truncated, true);
  assert.equal(summary.blockedFocus.blockingScope, 'external-provisioning');
  assert.equal(summary.learning.nextFocus.reasonCode, 'external-execution-required');
}));

test('MCP evaluation summary 在 ledger 非法时不回传 outcome 自由文本', () => withJsonutilsGovernanceMcpTempRoot((rootDir) => {
  const evalDir = path.join(rootDir, 'evals/ai-governance');
  fs.mkdirSync(evalDir, { recursive: true });
  fs.copyFileSync(path.join(projectRoot, 'evals/ai-governance/cases.json'), path.join(evalDir, 'cases.json'));
  copyLearningAssets(evalDir);
  fs.writeFileSync(path.join(evalDir, 'outcomes.jsonl'), `${JSON.stringify({
    schemaVersion: 1,
    id: 'outcome-invalid-summary',
    caseId: 'rule-read-before-write',
    corpusVersion: '1.0.0',
    caseVersion: 1,
    subjectVersion: '2026-07-10',
    evaluatedAt: '2026-07-10',
    verdict: 'pass',
    score: 100,
    provenance: { method: 'deterministic', source: 'local', runner: 'Bearer abcdefghijklmnop', revision: 'fixture', trials: 1 },
  })}\n`);
  fs.writeFileSync(path.join(evalDir, 'trial-receipts.jsonl'), '');
  const summary = buildJsonutilsEvaluationSummary({ rootDir, limit: 5, graderCalibrationRootDir: projectRoot });
  assert.equal(summary.ok, false);
  assert.deepEqual(summary.recentOutcomes, []);
}));

test('MCP evaluation summary 在空 outcome ledger 下诚实返回零覆盖', () => withJsonutilsGovernanceMcpTempRoot((rootDir) => {
  const evalDir = path.join(rootDir, 'evals/ai-governance');
  fs.mkdirSync(evalDir, { recursive: true });
  fs.copyFileSync(path.join(projectRoot, 'evals/ai-governance/cases.json'), path.join(evalDir, 'cases.json'));
  copyLearningAssets(evalDir);
  fs.writeFileSync(path.join(evalDir, 'outcomes.jsonl'), '');
  fs.writeFileSync(path.join(evalDir, 'trial-receipts.jsonl'), '');
  const summary = buildJsonutilsEvaluationSummary({ rootDir, limit: 5, graderCalibrationRootDir: projectRoot });
  assert.equal(summary.ok, true);
  assert.equal(summary.counts.outcomes, 0);
  assert.equal(summary.coverage.outcomes.percent, 0);
  assert.equal(summary.ledgerChain.status, 'empty');
  assert.deepEqual(summary.recentOutcomes, []);
}));
