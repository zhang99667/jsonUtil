import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  prepareEvolutionUnverifiedTraceOutcome,
  recordEvolutionUnverifiedTraceOutcome,
} from './aiGovernanceEvolutionUnverifiedTraceOutcomeWriter.mjs';
import { validateEvolutionDeterministicOutcomeCandidate } from './aiGovernanceEvolutionDeterministicOutcomeWriter.mjs';
import {
  acquireEvolutionOutcomeWriterLock,
  commitEvolutionOutcomeTransaction,
  recoverEvolutionOutcomeTransaction,
} from './aiGovernanceEvolutionDeterministicOutcomeTransaction.mjs';
import { hashEvolutionTrialReceiptLine } from './aiGovernanceEvolutionTrialReceipts.mjs';
import {
  buildUnverifiedTraceObservation as observation,
  UNVERIFIED_TRACE_CASE_ID as CASE_ID,
  UNVERIFIED_TRACE_EVALUATED_AT as EVALUATED_AT,
  UNVERIFIED_TRACE_REVISION as REVISION,
} from './aiGovernanceEvolutionUnverifiedTraceOutcomeWriterTestFixtures.mjs';
import { syncTracePolicyFixture } from './aiGovernanceTestFixtures.mjs';

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const RECEIPTS = 'evals/ai-governance/trial-receipts.jsonl';
const OUTCOMES = 'evals/ai-governance/outcomes.jsonl';
const noRecovery = () => ({ status: 'none', transactionId: null, ledgerMutationPerformed: false, ledgerMutations: { receipts: false, outcomes: false } });
const recoveredPair = () => ({ status: 'recovered', transactionId: `txn-${'a'.repeat(32)}`, ledgerMutationPerformed: true, ledgerMutations: { receipts: true, outcomes: true } });

const createFixture = (t) => {
  const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'jsonutils-unverified-trace-writer-'));
  const evalDir = path.join(rootDir, 'evals/ai-governance');
  fs.mkdirSync(evalDir, { recursive: true });
  for (const file of ['cases.json']) {
    fs.copyFileSync(path.join(PROJECT_ROOT, 'evals/ai-governance', file), path.join(evalDir, file));
  }
  syncTracePolicyFixture(rootDir, PROJECT_ROOT, { copyRequiredReads: true });
  fs.writeFileSync(path.join(rootDir, RECEIPTS), '');
  fs.writeFileSync(path.join(rootDir, OUTCOMES), '');
  t.after(() => fs.rmSync(rootDir, { recursive: true, force: true }));
  return {
    rootDir,
    receiptsPath: path.join(rootDir, RECEIPTS),
    outcomesPath: path.join(rootDir, OUTCOMES),
  };
};

const prepare = (fixture, input = observation(), overrides = {}) => prepareEvolutionUnverifiedTraceOutcome({
  rootDir: fixture.rootDir,
  observation: input,
  evaluatedAt: EVALUATED_AT,
  resolveRevision: () => REVISION,
  ...overrides,
});

const appendedRecord = (base, suffix) => JSON.parse(Buffer.concat([base, suffix])
  .toString('utf8').trim().split('\n').at(-1));

test('preview 派生 receipt v2/outcome v3 且只进入 trace-bound-unverified', (t) => {
  const fixture = createFixture(t);
  const result = prepare(fixture);
  const receipt = appendedRecord(result.transaction.receiptsBase, result.transaction.receiptSuffix);
  const outcome = appendedRecord(result.transaction.outcomesBase, result.transaction.outcomeSuffix);

  assert.equal(result.report.status, 'ready');
  assert.equal(result.report.evidenceStatus, 'trace-bound-unverified');
  assert.equal(result.report.confirmedCoverageEligible, false);
  assert.equal(result.report.ledgerMutationRequested, false);
  assert.deepEqual(result.report.counts, { candidates: 1, alreadyCurrent: 0, confirmedDelta: 0 });
  assert.equal(JSON.stringify(result.report).includes('maturityScorecard.nextFocus.id'), false);
  assert.equal(fs.readFileSync(fixture.receiptsPath, 'utf8'), '');
  assert.equal(fs.readFileSync(fixture.outcomesPath, 'utf8'), '');

  assert.equal(receipt.schemaVersion, 2);
  assert.equal(receipt.source, 'manual');
  assert.equal(receipt.runner, 'codex-exec-jsonl@1.2.1');
  assert.equal(receipt.revision, REVISION);
  assert.equal(receipt.trace.beforeRevision, REVISION);
  assert.equal(receipt.trace.afterRevision, REVISION);
  assert.equal(receipt.trace.policy.id, CASE_ID);
  assert.equal(receipt.proof, undefined);
  assert.deepEqual(receipt.trace.events.slice(-3).map(event => event.type), [
    'validation.start', 'validation.finish', 'session.finish',
  ]);
  assert.equal(receipt.validations[0].command, 'internal:verify-unverified-trace-candidate@1');
  assert.equal(outcome.schemaVersion, 3);
  assert.equal(outcome.evidence.sha256, hashEvolutionTrialReceiptLine(JSON.stringify(receipt)));
  assert.deepEqual(outcome.writeback.validationResults, receipt.validations);
  assert.equal(outcome.supersession.previousOutcomeId, null);
});

test('preview 拒绝无 policy、错误 adapter、不完整 capture 和禁用能力', (t) => {
  const fixture = createFixture(t);
  assert.throws(() => prepare(fixture, observation({ caseId: 'rule-read-before-write' })), /缺少注册 policy/);

  const wrongAdapter = observation();
  wrongAdapter.trace.adapter.version = '9.9.9';
  assert.throws(() => prepare(fixture, wrongAdapter), /未通过固定验证/);

  const partial = observation();
  partial.trace.capture.status = 'partial';
  assert.throws(() => prepare(fixture, partial), /未通过固定验证/);

  const forbidden = observation();
  forbidden.trace.events.splice(3, 0,
    { sequence: 4, type: 'capability.use', actorId: 'root', name: 'shell', status: 'passed' });
  forbidden.trace.events.forEach((event, index) => { event.sequence = index + 1; });
  assert.throws(() => prepare(fixture, forbidden), /未通过固定验证/);
});

test('相同 observation 幂等，不同 observation direct-supersede 未验信前序', (t) => {
  const fixture = createFixture(t);
  const first = prepare(fixture);
  fs.writeFileSync(fixture.receiptsPath, Buffer.concat([
    first.transaction.receiptsBase, first.transaction.receiptSuffix,
  ]));
  fs.writeFileSync(fixture.outcomesPath, Buffer.concat([
    first.transaction.outcomesBase, first.transaction.outcomeSuffix,
  ]));

  const same = prepare(fixture);
  assert.equal(same.report.status, 'already-current');
  assert.equal(same.transaction.receiptSuffix.length, 0);
  assert.equal(same.transaction.outcomeSuffix.length, 0);

  const changed = observation();
  changed.trace.events[3].sha256 = 'c'.repeat(64);
  const next = prepare(fixture, changed);
  const outcome = appendedRecord(next.transaction.outcomesBase, next.transaction.outcomeSuffix);
  assert.equal(next.report.status, 'ready');
  assert.equal(outcome.supersession.previousOutcomeId, first.report.candidate.outcomeId);
  assert.equal(outcome.chain.sequence, 2);
});

test('already-current preview 返回前仍复核 revision 与 live ledger 未漂移', (t) => {
  const fixture = createFixture(t);
  const first = prepare(fixture);
  fs.writeFileSync(fixture.receiptsPath, Buffer.concat([
    first.transaction.receiptsBase, first.transaction.receiptSuffix,
  ]));
  fs.writeFileSync(fixture.outcomesPath, Buffer.concat([
    first.transaction.outcomesBase, first.transaction.outcomeSuffix,
  ]));
  assert.throws(() => prepare(fixture, observation(), {
    validateCandidate: (args) => {
      const report = validateEvolutionDeterministicOutcomeCandidate(args);
      fs.appendFileSync(fixture.outcomesPath, 'tamper');
      return report;
    },
  }), /outcome ledger 在 preview 期间发生漂移/);
  fs.writeFileSync(fixture.outcomesPath, Buffer.concat([first.transaction.outcomesBase, first.transaction.outcomeSuffix]));
  let revisionCalls = 0;
  assert.throws(() => prepare(fixture, observation(), {
    resolveRevision: () => revisionCalls++ === 0 ? REVISION : `worktree-${'c'.repeat(64)}`,
  }), /source-state v2 revision 发生漂移/);
});

test('已有 confirmed current outcome 时拒绝 unverified 覆盖', (t) => {
  const fixture = createFixture(t);
  const first = prepare(fixture);
  fs.writeFileSync(fixture.receiptsPath, Buffer.concat([
    first.transaction.receiptsBase, first.transaction.receiptSuffix,
  ]));
  fs.writeFileSync(fixture.outcomesPath, Buffer.concat([
    first.transaction.outcomesBase, first.transaction.outcomeSuffix,
  ]));
  let calls = 0;
  assert.throws(() => prepare(fixture, observation(), {
    validateCandidate: (args) => {
      const report = validateEvolutionDeterministicOutcomeCandidate(args);
      if (calls++ === 0) report.scoredOutcomeIds = [first.report.candidate.outcomeId];
      return report;
    },
  }), /confirmed current outcome/);
});

test('write 在 CI 取锁前拒绝，本地真实事务使用共享 receipt-first control dir', (t) => {
  const fixture = createFixture(t);
  let acquireCalls = 0;
  assert.throws(() => recordEvolutionUnverifiedTraceOutcome({
    rootDir: fixture.rootDir, observation: observation(), write: true, env: { CI: '1' },
    transactionApi: {
      acquire: () => { acquireCalls += 1; }, recover: noRecovery, commit: () => ({}),
    },
  }), /CI\/GitHub Actions/);
  assert.equal(acquireCalls, 0);
  assert.equal(spawnSync('git', ['init', fixture.rootDir], { encoding: 'utf8' }).status, 0);
  const report = recordEvolutionUnverifiedTraceOutcome({
    rootDir: fixture.rootDir, observation: observation(), write: true, evaluatedAt: EVALUATED_AT,
    env: {}, resolveRevision: () => REVISION,
    transactionApi: {
      acquire: acquireEvolutionOutcomeWriterLock, recover: recoverEvolutionOutcomeTransaction,
      commit: commitEvolutionOutcomeTransaction,
    },
  });
  assert.equal(report.status, 'committed');
  assert.equal(report.ledgerMutationPerformed, true);
  assert.equal(fs.readFileSync(fixture.receiptsPath, 'utf8').trim().split('\n').length, 1);
  assert.equal(fs.readFileSync(fixture.outcomesPath, 'utf8').trim().split('\n').length, 1);
});

test('recovery 补写 trace ledger 后的 already-current 报告保留本次 mutation 事实', (t) => {
  const fixture = createFixture(t);
  const pending = prepare(fixture);
  const report = recordEvolutionUnverifiedTraceOutcome({
    rootDir: fixture.rootDir, observation: observation(), write: true, evaluatedAt: EVALUATED_AT,
    env: {}, resolveRevision: () => REVISION,
    transactionApi: {
      acquire: () => ({ release: () => {} }),
      recover: () => {
        fs.writeFileSync(fixture.receiptsPath, Buffer.concat([pending.transaction.receiptsBase, pending.transaction.receiptSuffix]));
        fs.writeFileSync(fixture.outcomesPath, Buffer.concat([pending.transaction.outcomesBase, pending.transaction.outcomeSuffix]));
        return recoveredPair();
      },
      commit: () => { throw new Error('already-current 不应再提交'); },
    },
  });
  assert.equal(report.status, 'already-current');
  assert.equal(report.recovery.ledgerMutationPerformed, true);
  assert.equal(report.ledgerMutationPerformed, true);
});
