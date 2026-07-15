import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { withJsonutilsGovernanceMcpTempRoot } from '../ci/jsonutilsGovernanceMcpTestFixtures.mjs';
import { buildRecentScoredOutcomeSummary } from './jsonutils-governance-evaluation-outcomes.mjs';
import { buildJsonutilsEvaluationSummary } from './jsonutils-governance-evaluations.mjs';

const projectRoot = path.resolve(import.meta.dirname, '../..');

const copyLearningAssets = (evalDir) => ['feedback-inbox.jsonl', 'experiments.json'].forEach(file => (
  fs.copyFileSync(path.join(projectRoot, 'evals/ai-governance', file), path.join(evalDir, file))
));

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

  const summary = buildJsonutilsEvaluationSummary({ rootDir, limit: 1 });
  assert.equal(summary.reportType, 'jsonutils-evaluation-summary');
  assert.equal(summary.counts.totalOutcomes, 2);
  assert.equal(summary.counts.outcomes, 0);
  assert.equal(summary.counts.activeLatestOutcomes, 0);
  assert.equal(summary.counts.legacyOutcomes, 2);
  assert.equal(summary.ledgerIntegrity.status, 'not-applicable');
  assert.equal(summary.ledgerChain.status, 'legacy');
  assert.deepEqual(summary.traceVerification, {
    status: 'unavailable', trustedSigners: 0, trustedAdapters: 0, policies: 0,
  });
  assert.deepEqual(summary.recentOutcomes, []);
  assert.equal(summary.recentOutcomesScope, 'verified-v2-v3');
  assert.equal(summary.truncated, false);
  const wide = buildJsonutilsEvaluationSummary({ rootDir, limit: 50 });
  assert.deepEqual(wide.counts, summary.counts);
  assert.deepEqual(wide.coverage, summary.coverage);
  assert.deepEqual(wide.nextFocus, summary.nextFocus);
  assert.deepEqual(wide.blockedFocus, summary.blockedFocus);
  assert.equal(summary.blockedFocus.blockingScope, 'external-provisioning');
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
  const summary = buildJsonutilsEvaluationSummary({ rootDir, limit: 5 });
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
  const summary = buildJsonutilsEvaluationSummary({ rootDir, limit: 5 });
  assert.equal(summary.ok, true);
  assert.equal(summary.counts.outcomes, 0);
  assert.equal(summary.coverage.outcomes.percent, 0);
  assert.equal(summary.ledgerChain.status, 'empty');
  assert.deepEqual(summary.recentOutcomes, []);
}));

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
