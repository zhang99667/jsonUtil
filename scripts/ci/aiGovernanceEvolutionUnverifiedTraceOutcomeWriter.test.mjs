import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  parseEvolutionUnverifiedTraceObservation,
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
import { runUnverifiedTraceOutcomeWriterCli } from './record-ai-evolution-unverified-trace-outcome.mjs';

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const CASE_ID = 'mcp-fixed-tool-selection';
const EVALUATED_AT = '2026-07-13';
const REVISION = `worktree-${'a'.repeat(64)}`;
const RECEIPTS = 'evals/ai-governance/trial-receipts.jsonl';
const OUTCOMES = 'evals/ai-governance/outcomes.jsonl';

const observation = (overrides = {}) => ({
  schemaVersion: 1,
  artifactType: 'ai-evolution-unverified-trace-observation',
  dataClass: 'redacted',
  caseId: CASE_ID,
  method: 'model',
  trace: {
    adapter: { id: 'codex-exec-jsonl', version: '1.2.0' },
    capture: {
      status: 'complete', sampling: 'all', droppedEvents: 0,
      droppedAttributes: 0, droppedLinks: 0, flushStatus: 'succeeded',
    },
    events: [
      { sequence: 1, type: 'session.start', actorId: 'root' },
      {
        sequence: 2, type: 'mcp.call', actorId: 'root', operationId: 'scorecard',
        name: 'jsonutils-governance/ai_governance_scorecard', status: 'started',
      },
      {
        sequence: 3, type: 'mcp.result', actorId: 'root', operationId: 'scorecard',
        name: 'jsonutils-governance/ai_governance_scorecard', status: 'passed',
        keys: ['maturityScorecard.nextFocus.id'],
      },
      { sequence: 4, type: 'response.finish', actorId: 'root', sha256: 'b'.repeat(64), status: 'passed' },
      { sequence: 5, type: 'session.finish', actorId: 'root', status: 'passed' },
    ],
  },
  ...overrides,
});

const createFixture = (t) => {
  const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'jsonutils-unverified-trace-writer-'));
  const evalDir = path.join(rootDir, 'evals/ai-governance');
  fs.mkdirSync(evalDir, { recursive: true });
  for (const file of ['cases.json', 'trace-policies.json']) {
    fs.copyFileSync(path.join(PROJECT_ROOT, 'evals/ai-governance', file), path.join(evalDir, file));
  }
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

test('observation parser 只接受精确紧凑、闭字段、redacted 输入', () => {
  const input = observation();
  assert.deepEqual(parseEvolutionUnverifiedTraceObservation(JSON.stringify(input)), input);
  assert.throws(() => parseEvolutionUnverifiedTraceObservation(JSON.stringify(input, null, 2)), /精确紧凑/);
  assert.throws(() => parseEvolutionUnverifiedTraceObservation(JSON.stringify({ ...input, score: 100 })), /闭字段/);
  assert.throws(() => parseEvolutionUnverifiedTraceObservation(JSON.stringify({ ...input, method: 'deterministic' })), /基础字段/);
  const nestedExtra = observation();
  nestedExtra.trace.adapter.proof = 'caller-controlled';
  assert.throws(() => parseEvolutionUnverifiedTraceObservation(JSON.stringify(nestedExtra)), /闭字段/);
  const callerValidation = observation();
  callerValidation.trace.events[3] = {
    sequence: 4, type: 'validation.start', actorId: 'root', validationIndex: 1, status: 'started',
  };
  assert.throws(() => parseEvolutionUnverifiedTraceObservation(JSON.stringify(callerValidation)), /不接受调用方提供/);
  const sensitive = observation();
  sensitive.trace.events[1].token = 'token=value';
  assert.throws(() => parseEvolutionUnverifiedTraceObservation(JSON.stringify(sensitive)), /敏感字段名/);
});

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
  assert.equal(receipt.runner, 'codex-exec-jsonl@1.2.0');
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
      acquire: () => { acquireCalls += 1; }, recover: () => ({ status: 'none' }), commit: () => ({}),
    },
  }), /CI\/GitHub Actions/);
  assert.equal(acquireCalls, 0);

  assert.equal(spawnSync('git', ['init', fixture.rootDir], { encoding: 'utf8' }).status, 0);
  const report = recordEvolutionUnverifiedTraceOutcome({
    rootDir: fixture.rootDir,
    observation: observation(),
    write: true,
    evaluatedAt: EVALUATED_AT,
    env: {},
    resolveRevision: () => REVISION,
    transactionApi: {
      acquire: acquireEvolutionOutcomeWriterLock,
      recover: recoverEvolutionOutcomeTransaction,
      commit: commitEvolutionOutcomeTransaction,
    },
  });
  assert.equal(report.status, 'committed');
  assert.equal(report.ledgerMutationPerformed, true);
  assert.equal(fs.readFileSync(fixture.receiptsPath, 'utf8').trim().split('\n').length, 1);
  assert.equal(fs.readFileSync(fixture.outcomesPath, 'utf8').trim().split('\n').length, 1);
});

test('CLI help 不读 stdin，未知参数为 2，输入错误为 1', () => {
  const sink = () => {
    let value = '';
    return { stream: { write: chunk => { value += chunk; } }, read: () => value };
  };
  const help = sink();
  assert.equal(runUnverifiedTraceOutcomeWriterCli({
    args: ['--help'], stdout: help.stream, stderr: sink().stream,
    readInput: () => { throw new Error('help must not read stdin'); },
  }), 0);
  assert.match(help.read(), /^Usage:/);

  const usage = sink();
  assert.equal(runUnverifiedTraceOutcomeWriterCli({
    args: ['--unknown'], stdout: sink().stream, stderr: usage.stream,
    readInput: () => { throw new Error('invalid args must not read stdin'); },
  }), 2);
  assert.match(usage.read(), /UNVERIFIED_TRACE_OUTCOME_WRITER_ARGUMENTS_INVALID/);

  const invalid = sink();
  assert.equal(runUnverifiedTraceOutcomeWriterCli({
    args: [], stdout: sink().stream, stderr: invalid.stream, readInput: () => '{}',
  }), 1);
  assert.match(invalid.read(), /failed/);

  const output = sink();
  assert.equal(runUnverifiedTraceOutcomeWriterCli({
    args: ['--json'], stdout: output.stream, stderr: sink().stream,
    readInput: () => JSON.stringify(observation()),
    record: ({ observation: parsed }) => ({
      ok: parsed.caseId === CASE_ID, mode: 'preview', status: 'ready', caseId: CASE_ID,
      evidenceStatus: 'trace-bound-unverified', revision: REVISION,
      candidate: { outcomeId: 'candidate' }, confirmedCoverageEligible: false,
    }),
  }), 0);
  assert.match(output.read(), /"evidenceStatus": "trace-bound-unverified"/);
});
