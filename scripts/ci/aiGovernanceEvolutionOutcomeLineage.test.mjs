import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

import { buildAiGovernanceEvolutionEvalReport } from './aiGovernanceEvolutionEvalReport.mjs';
import { hashEvolutionTrialReceiptLine } from './aiGovernanceEvolutionTrialReceipts.mjs';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const defaultCorpus = JSON.parse(fs.readFileSync(path.join(projectRoot, 'evals/ai-governance/cases.json'), 'utf8'));
const validOutcome = overrides => ({
  schemaVersion: 2,
  id: 'outcome-lineage-one',
  caseId: 'mcp-newline-version-negotiation',
  corpusVersion: '1.0.0',
  caseVersion: 1,
  subjectVersion: '0.3.0',
  evaluatedAt: '2026-07-10',
  verdict: 'pass',
  score: 100,
  provenance: { method: 'deterministic', source: 'local', runner: 'ai-evolution-case-runner', revision: `worktree-${'a'.repeat(40)}`, trials: 1 },
  writeback: {
    files: [],
    validationResults: [{ command: 'node --test scripts/mcp/jsonutils-governance-protocol-stdio.test.mjs', status: 'passed', evidence: 'fixture passed', checkedAt: '2026-07-10' }],
  },
  ...overrides,
});
const reportFor = (outcomes, corpus = defaultCorpus) => {
  const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'jsonutils-evolution-lineage-'));
  try {
    const evalDir = path.join(rootDir, 'evals/ai-governance');
    fs.mkdirSync(evalDir, { recursive: true });
    const withEvidence = outcomes.map((source) => {
      const outcome = structuredClone(source);
      const receipt = {
        schemaVersion: 1,
        id: `receipt-${outcome.id}`,
        artifactType: 'ai-evolution-trial-receipt',
        dataClass: 'redacted',
        caseId: outcome.caseId,
        corpusVersion: outcome.corpusVersion,
        caseVersion: outcome.caseVersion,
        subjectVersion: outcome.subjectVersion,
        evaluatedAt: outcome.evaluatedAt,
        method: outcome.provenance.method,
        source: outcome.provenance.source,
        runner: outcome.provenance.runner,
        revision: outcome.provenance.revision,
        aggregation: 'all-pass',
        trialResults: [{ trial: 1, verdict: outcome.verdict, score: outcome.score, gradeTarget: 'outcome', evidence: 'fixture grade' }],
        validations: outcome.writeback.validationResults,
      };
      const line = JSON.stringify(receipt);
      outcome.evidence = { receiptId: receipt.id, sha256: hashEvolutionTrialReceiptLine(line) };
      return { outcome, line };
    });
    fs.writeFileSync(path.join(evalDir, 'cases.json'), `${JSON.stringify(corpus)}\n`);
    fs.writeFileSync(path.join(evalDir, 'outcomes.jsonl'), withEvidence.map(item => JSON.stringify(item.outcome)).join('\n'));
    fs.writeFileSync(path.join(evalDir, 'trial-receipts.jsonl'), withEvidence.map(item => item.line).join('\n'));
    return buildAiGovernanceEvolutionEvalReport({
      rootDir,
      maxDate: '2026-07-13',
      replayDeterministic: ({ outcomes: active }) => ({
        verifiedOutcomeIds: new Set(active
          .filter(item => item.provenance.method === 'deterministic').map(item => item.id)), failures: [],
      }),
    });
  } finally {
    fs.rmSync(rootDir, { recursive: true, force: true });
  }
};

test('outcome ledger 要求 corpusVersion、caseVersion、subjectVersion 与 trial lineage', () => {
  const missingCorpusVersion = validOutcome({});
  delete missingCorpusVersion.corpusVersion;
  const missingCaseVersion = validOutcome({ id: 'outcome-lineage-two' });
  delete missingCaseVersion.caseVersion;
  const missingSubjectVersion = validOutcome({ id: 'outcome-lineage-three' });
  delete missingSubjectVersion.subjectVersion;
  const missingTrials = validOutcome({ id: 'outcome-lineage-four' });
  delete missingTrials.provenance.trials;
  const report = reportFor([missingCorpusVersion, missingCaseVersion, missingSubjectVersion, missingTrials]);
  assert.equal(report.ok, false);
  assert.match(report.failures.join('\n'), /corpusVersion 必须是 x\.y\.z/);
  assert.match(report.failures.join('\n'), /caseVersion 必须是正整数/);
  assert.match(report.failures.join('\n'), /subjectVersion 必须是安全的稳定版本标识/);
  assert.match(report.failures.join('\n'), /trials 必须是正整数/);
});

test('旧 fail 后追加新 pass 时只使用 ledger 最后一次当前版本结果', () => {
  const report = reportFor([
    validOutcome({ id: 'outcome-lineage-fail', verdict: 'fail', score: 20, feedback: '修复后重试' }),
    validOutcome({ id: 'outcome-lineage-pass' }),
  ]);
  assert.deepEqual(
    Object.fromEntries(['totalOutcomes', 'outcomes', 'activeLatestOutcomes', 'supersededOutcomes', 'staleOutcomes', 'pass', 'fail']
      .map(key => [key, report.counts[key]])),
    { totalOutcomes: 2, outcomes: 1, activeLatestOutcomes: 1, supersededOutcomes: 1, staleOutcomes: 0, pass: 1, fail: 0 }
  );
  assert.notEqual(report.nextFocus.id, 'address-outcome-feedback');
});

test('human、model 与 hybrid 弱结果保留为待验证反馈而不冒充已评分 outcome', () => {
  for (const [method, verdict] of [['human', 'fail'], ['model', 'partial'], ['hybrid', 'fail']]) {
    const id = `outcome-unverified-${method}`;
    const report = reportFor([validOutcome({
      id, verdict, score: 30, feedback: `${method} grader 发现待复核问题`,
      provenance: { method, source: 'manual', runner: `${method}-grader`, revision: `worktree-${'a'.repeat(40)}`, trials: 1 },
    })]);
    assert.equal(report.ok, true, method);
    assert.equal(report.counts.outcomes, 0, method);
    assert.equal(report.counts.unverifiedOutcomes, 1, method);
    assert.equal(report.counts[`unverified${verdict[0].toUpperCase()}${verdict.slice(1)}`], 1, method);
    assert.deepEqual(report.unverifiedOutcomeIds, [id], method);
    assert.equal(report.nextFocus.id, 'verify-nondeterministic-outcome', method);
  }
});

test('caseVersion 变化后旧 outcome 仅计入 stale history', () => {
  const corpus = structuredClone(defaultCorpus);
  corpus.cases.find(item => item.id === 'mcp-newline-version-negotiation').caseVersion = 2;
  corpus.corpusVersion = '1.1.0';
  const report = reportFor([validOutcome({ verdict: 'fail', score: 10, feedback: '旧版 case 的历史失败' })], corpus);
  assert.deepEqual(
    Object.fromEntries(['totalOutcomes', 'outcomes', 'activeLatestOutcomes', 'staleOutcomes', 'historyOutcomes', 'fail', 'coveredCases']
      .map(key => [key, report.counts[key]])),
    { totalOutcomes: 1, outcomes: 0, activeLatestOutcomes: 0, staleOutcomes: 1, historyOutcomes: 1, fail: 0, coveredCases: 0 }
  );
  assert.equal(report.nextFocus.id, 'record-first-outcomes');
});

test('corpusVersion 变化不会让 caseVersion 未变的 outcome 失效', () => {
  const corpus = structuredClone(defaultCorpus);
  corpus.corpusVersion = '2.0.0';
  const report = reportFor([validOutcome({ corpusVersion: '1.0.0' })], corpus);
  assert.equal(report.ok, true);
  assert.equal(report.counts.activeLatestOutcomes, 1);
  assert.equal(report.counts.staleOutcomes, 0);
  assert.equal(report.counts.pass, 1);
});

test('subjectVersion 变化会让旧实现 outcome 进入 stale history', () => {
  const corpus = structuredClone(defaultCorpus);
  corpus.cases.find(item => item.id === 'mcp-newline-version-negotiation').subject.version = '0.2.1';
  const report = reportFor([validOutcome({})], corpus);
  assert.equal(report.ok, true);
  assert.equal(report.counts.activeLatestOutcomes, 0);
  assert.equal(report.counts.staleOutcomes, 1);
});

test('未来 caseVersion outcome 会失败而不是伪装成 stale', () => {
  const report = reportFor([validOutcome({ caseVersion: 2 })]);
  assert.equal(report.ok, false);
  assert.equal(report.counts.invalidOutcomes, 1);
  assert.equal(report.counts.staleOutcomes, 0);
  assert.match(report.failures.join('\n'), /禁止预埋未来结果/);
});

test('较早 evaluatedAt 的追加记录不能覆盖较新失败', () => {
  const report = reportFor([
    validOutcome({ id: 'outcome-lineage-newer-fail', verdict: 'fail', score: 20, feedback: '仍需修复' }),
    validOutcome({
      id: 'outcome-lineage-backdated-pass',
      evaluatedAt: '2026-07-09',
      writeback: {
        files: [],
        validationResults: [{
          command: 'node --test scripts/mcp/jsonutils-governance-protocol-stdio.test.mjs',
          status: 'passed', evidence: 'backdated fixture', checkedAt: '2026-07-09',
        }],
      },
    }),
  ]);
  assert.equal(report.ok, false);
  assert.equal(report.counts.pass, 0);
  assert.match(report.failures.join('\n'), /不能早于前序记录/);
});

test('退休 case outcome 保留为 history 且不阻塞 append-only ledger', () => {
  const corpus = structuredClone(defaultCorpus);
  corpus.cases = corpus.cases.filter(item => item.id !== 'mcp-config-credential-security');
  corpus.retiredCaseIds = ['mcp-config-credential-security'];
  const report = reportFor([validOutcome({
    caseId: 'mcp-config-credential-security',
    subjectVersion: '2026-07-10',
    writeback: {
      files: [],
      validationResults: [{
        command: 'node --test scripts/ci/aiGovernanceMcpSensitiveValues.test.mjs scripts/ci/aiGovernanceMcpConfigRuntimeContract.test.mjs',
        status: 'passed', evidence: 'fixture passed', checkedAt: '2026-07-10',
      }],
    },
  })], corpus);
  assert.equal(report.ok, true);
  assert.equal(report.counts.activeLatestOutcomes, 0);
  assert.equal(report.counts.retiredOutcomes, 1);
  assert.equal(report.counts.historyOutcomes, 1);
});
