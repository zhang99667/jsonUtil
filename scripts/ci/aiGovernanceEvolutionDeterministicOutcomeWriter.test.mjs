import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  AI_EVOLUTION_EXECUTABLE_CASES,
  getAiGovernanceEvolutionCaseCommands,
} from './aiGovernanceEvolutionCaseRunner.mjs';
import {
  prepareEvolutionDeterministicOutcomeBatch,
  recordEvolutionDeterministicOutcomes,
} from './aiGovernanceEvolutionDeterministicOutcomeWriter.mjs';
import {
  acquireEvolutionOutcomeWriterLock,
  commitEvolutionOutcomeTransaction,
  recoverEvolutionOutcomeTransaction,
} from './aiGovernanceEvolutionDeterministicOutcomeTransaction.mjs';
import {
  hashEvolutionOutcomeLegacyPrefix,
  hashEvolutionOutcomeV3Line,
} from './aiGovernanceEvolutionOutcomeChain.mjs';
import { hashEvolutionTrialReceiptLine } from './aiGovernanceEvolutionTrialReceipts.mjs';
import { runDeterministicOutcomeWriterCli } from './record-ai-evolution-deterministic-outcomes.mjs';

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const CASE_ID = 'mcp-readonly-shell-rejection';
const EVALUATED_AT = '2026-07-15';
const REVISION_A = `worktree-${'a'.repeat(64)}`;
const REVISION_B = `worktree-${'b'.repeat(64)}`;
const RECEIPTS = 'evals/ai-governance/trial-receipts.jsonl';
const OUTCOMES = 'evals/ai-governance/outcomes.jsonl';
const noRecovery = () => ({ status: 'none', transactionId: null, ledgerMutationPerformed: false, ledgerMutations: { receipts: false, outcomes: false } });
const recoveredPair = () => ({ status: 'recovered', transactionId: `txn-${'a'.repeat(32)}`, ledgerMutationPerformed: true, ledgerMutations: { receipts: true, outcomes: true } });

const createFixture = (t) => {
  const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'jsonutils-outcome-writer-'));
  const evalDir = path.join(rootDir, 'evals/ai-governance');
  fs.mkdirSync(evalDir, { recursive: true });
  fs.copyFileSync(path.join(PROJECT_ROOT, 'evals/ai-governance/cases.json'), path.join(evalDir, 'cases.json'));
  fs.writeFileSync(path.join(rootDir, RECEIPTS), '');
  fs.writeFileSync(path.join(rootDir, OUTCOMES), '');
  t.after(() => fs.rmSync(rootDir, { recursive: true, force: true }));
  return {
    rootDir,
    receiptsPath: path.join(rootDir, RECEIPTS),
    outcomesPath: path.join(rootDir, OUTCOMES),
  };
};

const passedRunner = ({ rootDir, caseIds }) => ({
  schemaVersion: 3,
  reportType: 'ai-governance-evolution-case-run',
  ok: true,
  results: caseIds.map((caseId) => {
    const descriptor = AI_EVOLUTION_EXECUTABLE_CASES[caseId];
    return {
      caseId,
      caseVersion: descriptor.caseVersion,
      subjectVersion: descriptor.subjectVersion,
      evidenceScope: descriptor.evidenceScope,
      outcomeEligible: true,
      status: 'passed',
      evidence: descriptor.evidence,
      validations: getAiGovernanceEvolutionCaseCommands({ rootDir, caseId })
        .map(command => ({ command, status: 'passed' })),
    };
  }),
});

const candidateValidator = capture => (candidate) => {
  if (capture) capture.value = candidate;
  return { ledgerIntegrity: { status: 'unknown' } };
};

const lastRecord = bytes => JSON.parse(bytes.toString('utf8').trim().split('\n').at(-1));

const prepare = (fixture, overrides = {}) => prepareEvolutionDeterministicOutcomeBatch({
  rootDir: fixture.rootDir,
  caseIds: [CASE_ID],
  evaluatedAt: EVALUATED_AT,
  runCases: passedRunner,
  resolveRevision: () => REVISION_A,
  validateCandidate: candidateValidator(),
  ...overrides,
});

test('preview 从安全快照派生 receipt/outcome，不修改真实 ledger 或 control state', (t) => {
  const fixture = createFixture(t);
  const capture = {};
  const result = prepare(fixture, { validateCandidate: candidateValidator(capture) });
  const receipt = lastRecord(capture.value.receiptsBytes);
  const outcome = lastRecord(capture.value.outcomesBytes);

  assert.equal(result.report.status, 'ready');
  assert.equal(result.report.ledgerMutationRequested, false);
  assert.deepEqual(result.report.counts, { selected: 1, candidates: 1, alreadyCurrent: 0 });
  assert.equal(fs.readFileSync(fixture.receiptsPath, 'utf8'), '');
  assert.equal(fs.readFileSync(fixture.outcomesPath, 'utf8'), '');
  assert.equal(fs.existsSync(path.join(fixture.rootDir, '.git')), false);
  assert.ok(Buffer.isBuffer(result.transaction.receiptsBase));
  assert.ok(Buffer.isBuffer(result.transaction.outcomesBase));
  assert.ok(Buffer.isBuffer(result.transaction.receiptSuffix));
  assert.ok(Buffer.isBuffer(result.transaction.outcomeSuffix));

  const descriptor = AI_EVOLUTION_EXECUTABLE_CASES[CASE_ID];
  assert.equal(receipt.caseVersion, descriptor.caseVersion);
  assert.equal(receipt.subjectVersion, descriptor.subjectVersion);
  assert.equal(receipt.revision, REVISION_A);
  assert.equal(receipt.trialResults[0].verdict, 'pass');
  assert.deepEqual(receipt.validations.map(item => item.command),
    getAiGovernanceEvolutionCaseCommands({ rootDir: fixture.rootDir, caseId: CASE_ID }));
  assert.equal(outcome.chain.sequence, 1);
  assert.equal(outcome.chain.previousHash, hashEvolutionOutcomeLegacyPrefix([]));
  assert.equal(outcome.supersession.previousOutcomeId, null);
  assert.equal(outcome.supersession.feedbackDisposition, 'none');
  assert.equal(outcome.evidence.receiptId, receipt.id);
  assert.equal(outcome.evidence.sha256, hashEvolutionTrialReceiptLine(JSON.stringify(receipt)));
  assert.deepEqual(outcome.writeback.validationResults, receipt.validations);
});

test('preview 拒绝 ownership、component、unknown 与重复 case', (t) => {
  const fixture = createFixture(t);
  const base = {
    rootDir: fixture.rootDir,
    evaluatedAt: EVALUATED_AT,
    runCases: passedRunner,
    resolveRevision: () => REVISION_A,
    validateCandidate: candidateValidator(),
  };
  assert.throws(() => prepareEvolutionDeterministicOutcomeBatch({
    ...base, caseIds: ['rule-project-ai-asset-ownership'],
  }), /index\/HEAD 分发证据/);
  assert.throws(() => prepareEvolutionDeterministicOutcomeBatch({
    ...base, caseIds: ['mcp-fixed-tool-selection'],
  }), /behavior deterministic-case/);
  assert.throws(() => prepareEvolutionDeterministicOutcomeBatch({
    ...base, caseIds: ['unknown-case'],
  }), /不支持/);
  assert.throws(() => prepareEvolutionDeterministicOutcomeBatch({
    ...base, caseIds: [CASE_ID, CASE_ID],
  }), /不能重复/);
});

test('preview 拒绝 ledger symlink、hardlink 和期间漂移', (t) => {
  const symlinkFixture = createFixture(t);
  const target = path.join(symlinkFixture.rootDir, 'receipt-target.jsonl');
  fs.renameSync(symlinkFixture.receiptsPath, target);
  fs.symlinkSync(target, symlinkFixture.receiptsPath);
  assert.throws(() => prepare(symlinkFixture), /symlink/);

  const hardlinkFixture = createFixture(t);
  fs.unlinkSync(hardlinkFixture.outcomesPath);
  fs.linkSync(hardlinkFixture.receiptsPath, hardlinkFixture.outcomesPath);
  assert.throws(() => prepare(hardlinkFixture), /单链接|inode/);

  const driftFixture = createFixture(t);
  assert.throws(() => prepare(driftFixture, {
    validateCandidate: (candidate) => {
      fs.appendFileSync(driftFixture.receiptsPath, 'drift');
      return candidateValidator()(candidate);
    },
  }), /receipt ledger 在 preview 期间发生漂移/);
});

test('runner、candidate replay 和 source-state 漂移均 fail closed', (t) => {
  const fixture = createFixture(t);
  assert.throws(() => prepare(fixture, {
    runCases: () => ({ ok: false, results: [{ caseId: CASE_ID, status: 'failed', diagnostic: 'fixture failure' }] }),
  }), /固定 runner 失败/);

  let calls = 0;
  assert.throws(() => prepare(fixture, {
    resolveRevision: () => (++calls === 1 ? REVISION_A : REVISION_B),
  }), /runner 执行期间/);

  calls = 0;
  assert.throws(() => prepare(fixture, {
    resolveRevision: () => (++calls < 3 ? REVISION_A : REVISION_B),
  }), /candidate replay 期间/);

  assert.throws(() => prepare(fixture, {
    validateCandidate: () => { throw new Error('candidate rejected'); },
  }), /candidate rejected/);
});

test('同 revision 已有有效 pass 时幂等 no-op，不再执行 runner', (t) => {
  const fixture = createFixture(t);
  const capture = {};
  prepare(fixture, { validateCandidate: candidateValidator(capture) });
  fs.writeFileSync(fixture.receiptsPath, capture.value.receiptsBytes);
  fs.writeFileSync(fixture.outcomesPath, capture.value.outcomesBytes);
  const result = prepare(fixture, {
    runCases: () => { throw new Error('runner should not run'); },
  });
  assert.equal(result.report.status, 'already-current');
  assert.deepEqual(result.report.counts, { selected: 1, candidates: 0, alreadyCurrent: 1 });
  assert.equal(result.transaction.receiptSuffix.length, 0);
  assert.equal(result.transaction.outcomeSuffix.length, 0);
});

test('前序 fail 的新 pass 使用 direct supersession 并标记 resolved', (t) => {
  const fixture = createFixture(t);
  const initial = {};
  prepare(fixture, { validateCandidate: candidateValidator(initial) });
  const receipt = lastRecord(initial.value.receiptsBytes);
  receipt.id = `${receipt.id}-fail`;
  receipt.trialResults[0].verdict = 'fail';
  receipt.trialResults[0].score = 0;
  const outcome = lastRecord(initial.value.outcomesBytes);
  outcome.id = `${outcome.id}-fail`;
  outcome.verdict = 'fail';
  outcome.score = 0;
  outcome.feedback = '固定负例失败，等待下一次真实重放';
  outcome.evidence = {
    receiptId: receipt.id,
    sha256: hashEvolutionTrialReceiptLine(JSON.stringify(receipt)),
  };
  outcome.supersession.feedbackDisposition = 'open';
  outcome.supersession.summary = '保留当前失败作为 lineage 前序';
  const failOutcomeLine = JSON.stringify(outcome);
  fs.writeFileSync(fixture.receiptsPath, `${JSON.stringify(receipt)}\n`);
  fs.writeFileSync(fixture.outcomesPath, `${failOutcomeLine}\n`);

  const capture = {};
  prepare(fixture, { validateCandidate: candidateValidator(capture) });
  const resolved = lastRecord(capture.value.outcomesBytes);
  assert.equal(resolved.supersession.previousOutcomeId, outcome.id);
  assert.equal(resolved.supersession.feedbackDisposition, 'resolved');
  assert.equal(resolved.chain.sequence, 2);
  assert.equal(resolved.chain.previousHash, hashEvolutionOutcomeV3Line(failOutcomeLine));
});

test('write API 在 CI 先于 lock 拒绝，本地则传递 Buffer 事务并释放 lock', (t) => {
  const fixture = createFixture(t);
  let acquireCalls = 0;
  assert.throws(() => recordEvolutionDeterministicOutcomes({
    rootDir: fixture.rootDir, caseIds: [CASE_ID], write: true, env: { CI: '1' },
    transactionApi: {
      acquire: () => { acquireCalls += 1; }, recover: noRecovery, commit: () => ({ status: 'committed' }),
    },
  }), /CI\/GitHub Actions/);
  assert.equal(acquireCalls, 0);
  let released = false;
  const lock = { controlDir: '/control', lockPath: '/control/lock', journalPath: '/control/journal', token: 'token',
    release: () => { released = true; } };
  const report = recordEvolutionDeterministicOutcomes({
    rootDir: fixture.rootDir, caseIds: [CASE_ID], write: true, evaluatedAt: EVALUATED_AT, env: {},
    runCases: passedRunner, resolveRevision: () => REVISION_A, validateCandidate: candidateValidator(),
    transactionApi: {
      acquire: () => lock,
      recover: ({ controlPaths }) => {
        assert.equal(controlPaths, lock);
        return noRecovery();
      },
      commit: ({ controlPaths, receiptsBase, outcomesBase, receiptSuffix, outcomeSuffix }) => {
        assert.equal(controlPaths, lock);
        [receiptsBase, outcomesBase, receiptSuffix, outcomeSuffix].forEach(value => assert.ok(Buffer.isBuffer(value)));
        return { status: 'committed', transactionId: 'txn-fixture' };
      },
    },
  });
  assert.equal(report.status, 'committed');
  assert.equal(report.ledgerMutationRequested, true);
  assert.equal(report.ledgerMutationPerformed, true);
  assert.equal(released, true);
});

test('recovery 补写 ledger 后的 already-current 报告保留本次 mutation 事实', (t) => {
  const fixture = createFixture(t);
  const pending = prepare(fixture);
  const lock = { release: () => {} };
  const report = recordEvolutionDeterministicOutcomes({
    rootDir: fixture.rootDir, caseIds: [CASE_ID], write: true, evaluatedAt: EVALUATED_AT, env: {},
    runCases: passedRunner, resolveRevision: () => REVISION_A, validateCandidate: candidateValidator(),
    transactionApi: {
      acquire: () => lock,
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

test('真实本地事务接线使用 Git control dir 完成 pair 且清理 journal', (t) => {
  const fixture = createFixture(t);
  assert.equal(spawnSync('git', ['init', fixture.rootDir], { encoding: 'utf8' }).status, 0);
  let controlDir;
  const report = recordEvolutionDeterministicOutcomes({
    rootDir: fixture.rootDir,
    caseIds: [CASE_ID],
    write: true,
    evaluatedAt: EVALUATED_AT,
    env: {},
    runCases: passedRunner,
    resolveRevision: () => REVISION_A,
    validateCandidate: candidateValidator(),
    transactionApi: {
      acquire: (options) => {
        const lock = acquireEvolutionOutcomeWriterLock(options);
        controlDir = lock.controlDir;
        return lock;
      },
      recover: recoverEvolutionOutcomeTransaction,
      commit: options => commitEvolutionOutcomeTransaction({ ...options, postcheck: () => ({ ok: true }) }),
    },
  });
  assert.equal(report.status, 'committed');
  assert.equal(fs.readFileSync(fixture.receiptsPath, 'utf8').trim().split('\n').length, 1);
  assert.equal(fs.readFileSync(fixture.outcomesPath, 'utf8').trim().split('\n').length, 1);
  assert.equal(fs.existsSync(path.join(controlDir, 'writer.lock')), false);
  assert.equal(fs.existsSync(path.join(controlDir, 'transaction.json')), false);
});

test('CLI help 不读 ledger，非法和重复参数稳定返回 2', () => {
  const sink = () => {
    let value = '';
    return { stream: { write: chunk => { value += chunk; } }, read: () => value };
  };
  const helpOut = sink();
  assert.equal(runDeterministicOutcomeWriterCli({
    args: ['--help'], stdout: helpOut.stream, stderr: sink().stream,
    record: () => { throw new Error('help must not read ledger'); },
  }), 0);
  assert.match(helpOut.read(), /^Usage:/);

  for (const args of [['--unknown'], ['--case', CASE_ID, '--case', CASE_ID]]) {
    const errorOut = sink();
    assert.equal(runDeterministicOutcomeWriterCli({
      args, stdout: sink().stream, stderr: errorOut.stream,
      record: () => { throw new Error('invalid args must not read ledger'); },
    }), 2);
    assert.match(errorOut.read(), /^Usage:[\s\S]+DETERMINISTIC_OUTCOME_WRITER_ARGUMENTS_INVALID/m);
  }
});
