import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { test } from 'node:test';

import {
  acquireEvolutionOutcomeWriterLock,
  commitEvolutionOutcomeTransaction,
  recoverEvolutionOutcomeTransaction,
} from './aiGovernanceEvolutionDeterministicOutcomeTransaction.mjs';

const RECEIPTS = 'evals/ai-governance/trial-receipts.jsonl';
const OUTCOMES = 'evals/ai-governance/outcomes.jsonl';

const git = (rootDir, args) => spawnSync('git', ['-C', rootDir, ...args], { encoding: 'utf8' });
const revisionFor = rootDir => `worktree-${createHash('sha256').update(fs.readFileSync(path.join(rootDir, 'source.txt'))).digest('hex')}`;
const journalDigest = value => createHash('sha256')
  .update(`jsonutils.ai-evolution.outcome-transaction/v1\0${JSON.stringify(value)}`).digest('hex');
const resealJournal = (journal) => {
  const seed = { schemaVersion: journal.schemaVersion, revision: journal.revision,
    receipts: journal.receipts, outcomes: journal.outcomes };
  journal.transactionId = `txn-${journalDigest(seed).slice(0, 32)}`;
  const unsigned = { schemaVersion: journal.schemaVersion, transactionId: journal.transactionId,
    revision: journal.revision, receipts: journal.receipts, outcomes: journal.outcomes };
  journal.transactionSha256 = journalDigest(unsigned);
};

const createRepository = () => {
  const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'jsonutils-outcome-transaction-'));
  fs.mkdirSync(path.join(rootDir, 'evals/ai-governance'), { recursive: true });
  fs.writeFileSync(path.join(rootDir, RECEIPTS), '');
  fs.writeFileSync(path.join(rootDir, OUTCOMES), '');
  fs.writeFileSync(path.join(rootDir, 'source.txt'), 'source-v1\n');
  assert.equal(git(rootDir, ['init']).status, 0);
  assert.equal(git(rootDir, ['config', 'user.email', 'test@example.com']).status, 0);
  assert.equal(git(rootDir, ['config', 'user.name', 'Test']).status, 0);
  assert.equal(git(rootDir, ['add', '.']).status, 0);
  assert.equal(git(rootDir, ['commit', '-m', 'fixture']).status, 0);
  return rootDir;
};

const fixture = (t) => {
  const rootDir = createRepository();
  t.after(() => fs.rmSync(rootDir, { recursive: true, force: true }));
  const controlPaths = acquireEvolutionOutcomeWriterLock({ rootDir });
  t.after(() => {
    try { controlPaths.release(); } catch { /* 测试可能故意破坏 lock。 */ }
  });
  return { rootDir, controlPaths };
};

const transactionInput = ({ rootDir, controlPaths, overrides = {} }) => ({
  rootDir,
  controlPaths,
  revision: revisionFor(rootDir),
  receiptsPath: RECEIPTS,
  outcomesPath: OUTCOMES,
  receiptsBase: fs.readFileSync(path.join(rootDir, RECEIPTS)),
  outcomesBase: fs.readFileSync(path.join(rootDir, OUTCOMES)),
  receiptSuffix: Buffer.from('{"receipt":1}\n'),
  outcomeSuffix: Buffer.from('{"outcome":1}\n'),
  resolveRevision: revisionFor,
  postcheck: () => true,
  ...overrides,
});

test('transaction 成功按 receipt-first 写入、postcheck 后清理 durable journal', (t) => {
  const current = fixture(t);
  const phases = [];
  const result = commitEvolutionOutcomeTransaction(transactionInput({
    ...current,
    overrides: { faultInjector: phase => phases.push(phase) },
  }));
  assert.equal(result.status, 'committed');
  assert.equal(fs.readFileSync(path.join(current.rootDir, RECEIPTS), 'utf8'), '{"receipt":1}\n');
  assert.equal(fs.readFileSync(path.join(current.rootDir, OUTCOMES), 'utf8'), '{"outcome":1}\n');
  assert.deepEqual(phases, ['after-journal', 'after-receipt', 'after-outcome']);
  assert.equal(fs.existsSync(current.controlPaths.journalPath), false);
});

test('control dir 由 hermetic git-path 解析并支持 linked worktree', (t) => {
  const primary = createRepository();
  const linked = fs.mkdtempSync(path.join(os.tmpdir(), 'jsonutils-linked-worktree-parent-'));
  fs.rmdirSync(linked);
  t.after(() => {
    git(primary, ['worktree', 'remove', '--force', linked]);
    fs.rmSync(primary, { recursive: true, force: true });
    fs.rmSync(linked, { recursive: true, force: true });
  });
  assert.equal(git(primary, ['worktree', 'add', '-b', 'linked-fixture', linked]).status, 0);
  const lock = acquireEvolutionOutcomeWriterLock({ rootDir: linked });
  const expected = git(linked, ['rev-parse', '--path-format=absolute', '--git-path', 'jsonutils-ai-governance/outcome-writer']).stdout.trim();
  assert.equal(lock.controlDir, expected);
  assert.equal(fs.lstatSync(path.join(linked, '.git')).isFile(), true);
  lock.release();
});

test('lock 拒绝 live、跨 host 和半写 metadata，并可原子接管 dead PID', (t) => {
  const rootDir = createRepository();
  t.after(() => fs.rmSync(rootDir, { recursive: true, force: true }));
  const first = acquireEvolutionOutcomeWriterLock({ rootDir });
  assert.throws(() => acquireEvolutionOutcomeWriterLock({ rootDir }), /live outcome writer/);
  const lockPath = first.lockPath;
  const controlDir = first.controlDir;
  first.release();

  fs.writeFileSync(lockPath, JSON.stringify({ schemaVersion: 1, pid: process.pid, hostname: 'other-host', token: 'a'.repeat(32) }), { mode: 0o600 });
  assert.throws(() => acquireEvolutionOutcomeWriterLock({ rootDir }), /其它 host/);
  fs.unlinkSync(lockPath);
  fs.writeFileSync(lockPath, '', { mode: 0o600 });
  assert.throws(() => acquireEvolutionOutcomeWriterLock({ rootDir }), /权限或大小非法|不完整/);
  fs.unlinkSync(lockPath);
  fs.writeFileSync(lockPath, JSON.stringify({ schemaVersion: 1, pid: 2_147_483_647, hostname: os.hostname(), token: 'b'.repeat(32) }), { mode: 0o600 });
  const recovered = acquireEvolutionOutcomeWriterLock({ rootDir });
  assert.equal(recovered.controlDir, controlDir);
  recovered.release();
});

test('ledger 拒绝 symlink、hardlink 和同 inode', (t) => {
  const current = fixture(t);
  const receiptPath = path.join(current.rootDir, RECEIPTS);
  const target = path.join(current.rootDir, 'receipt-target.jsonl');
  fs.renameSync(receiptPath, target);
  fs.symlinkSync(target, receiptPath);
  assert.throws(() => commitEvolutionOutcomeTransaction(transactionInput(current)), /symlink/);
  fs.unlinkSync(receiptPath);
  fs.renameSync(target, receiptPath);

  const outcomePath = path.join(current.rootDir, OUTCOMES);
  fs.unlinkSync(outcomePath);
  fs.linkSync(receiptPath, outcomePath);
  assert.throws(() => commitEvolutionOutcomeTransaction(transactionInput(current)), /单链接|同一 inode/);
});

test('journal durable 后的 source 或 endpoint 漂移在首个 append 前零写终止', (t) => {
  for (const mutation of ['source', 'endpoint']) {
    const current = fixture(t);
    const input = transactionInput({
      ...current,
      overrides: {
        faultInjector: (phase) => {
          if (phase !== 'after-journal') return;
          if (mutation === 'source') fs.writeFileSync(path.join(current.rootDir, 'source.txt'), 'source-v2\n');
          else {
            const file = path.join(current.rootDir, RECEIPTS);
            const future = new Date(Date.now() + 10_000);
            fs.utimesSync(file, future, future);
          }
        },
      },
    });
    assert.throws(() => commitEvolutionOutcomeTransaction(input), /临写前 source\/endpoint 漂移/);
    assert.equal(fs.readFileSync(path.join(current.rootDir, RECEIPTS), 'utf8'), '');
    assert.equal(fs.readFileSync(path.join(current.rootDir, OUTCOMES), 'utf8'), '');
    assert.equal(fs.existsSync(current.controlPaths.journalPath), false);
  }
});

test('both-base journal 遇 source drift 可安全放弃且不写 ledger', (t) => {
  const current = fixture(t);
  assert.throws(() => commitEvolutionOutcomeTransaction(transactionInput({
    ...current,
    overrides: { faultInjector: phase => { if (phase === 'after-journal') throw new Error('simulated crash'); } },
  })), /simulated crash/);
  assert.equal(fs.existsSync(current.controlPaths.journalPath), true);
  fs.writeFileSync(path.join(current.rootDir, 'source.txt'), 'source-v2\n');
  const result = recoverEvolutionOutcomeTransaction({
    ...current,
    receiptsPath: RECEIPTS,
    outcomesPath: OUTCOMES,
    resolveRevision: revisionFor,
  });
  assert.equal(result.status, 'abandoned-source-drift');
  assert.equal(result.ledgerMutationPerformed, false);
  assert.deepEqual(result.ledgerMutations, { receipts: false, outcomes: false });
  assert.equal(fs.readFileSync(path.join(current.rootDir, RECEIPTS), 'utf8'), '');
  assert.equal(fs.readFileSync(path.join(current.rootDir, OUTCOMES), 'utf8'), '');
  assert.equal(fs.existsSync(current.controlPaths.journalPath), false);
});

test('receipt exact-prefix crash 恢复先补 receipt 再补 outcome，绝不 truncate', (t) => {
  const current = fixture(t);
  const input = transactionInput({
    ...current,
    overrides: { faultInjector: phase => { if (phase === 'after-journal') throw new Error('simulated crash'); } },
  });
  assert.throws(() => commitEvolutionOutcomeTransaction(input), /simulated crash/);
  fs.appendFileSync(path.join(current.rootDir, RECEIPTS), input.receiptSuffix.subarray(0, 5));
  const result = recoverEvolutionOutcomeTransaction({
    ...current, receiptsPath: RECEIPTS, outcomesPath: OUTCOMES, resolveRevision: revisionFor,
  });
  assert.equal(result.status, 'recovered');
  assert.equal(result.ledgerMutationPerformed, true);
  assert.deepEqual(result.ledgerMutations, { receipts: true, outcomes: true });
  assert.deepEqual(fs.readFileSync(path.join(current.rootDir, RECEIPTS)), input.receiptSuffix);
  assert.deepEqual(fs.readFileSync(path.join(current.rootDir, OUTCOMES)), input.outcomeSuffix);
  assert.equal(fs.existsSync(current.controlPaths.journalPath), false);
});

test('receipt 已开始后即使 source 漂移仍完成 pair 并标记 recovered-stale', (t) => {
  const current = fixture(t);
  const input = transactionInput({
    ...current,
    overrides: { faultInjector: phase => { if (phase === 'after-receipt') throw new Error('simulated crash'); } },
  });
  assert.throws(() => commitEvolutionOutcomeTransaction(input), /simulated crash/);
  fs.writeFileSync(path.join(current.rootDir, 'source.txt'), 'source-v2\n');
  const result = recoverEvolutionOutcomeTransaction({
    ...current, receiptsPath: RECEIPTS, outcomesPath: OUTCOMES, resolveRevision: revisionFor,
  });
  assert.equal(result.status, 'recovered-stale');
  assert.equal(result.ledgerMutationPerformed, true);
  assert.deepEqual(result.ledgerMutations, { receipts: false, outcomes: true });
  assert.deepEqual(fs.readFileSync(path.join(current.rootDir, RECEIPTS)), input.receiptSuffix);
  assert.deepEqual(fs.readFileSync(path.join(current.rootDir, OUTCOMES)), input.outcomeSuffix);
});

test('journal/ledger tamper 或 expected 外额外字节 fail closed 且不 truncate', (t) => {
  const current = fixture(t);
  const input = transactionInput({
    ...current,
    overrides: { faultInjector: phase => { if (phase === 'after-journal') throw new Error('simulated crash'); } },
  });
  assert.throws(() => commitEvolutionOutcomeTransaction(input), /simulated crash/);
  fs.appendFileSync(path.join(current.rootDir, RECEIPTS), Buffer.from('unexpected'));
  const before = fs.readFileSync(path.join(current.rootDir, RECEIPTS));
  assert.throws(() => recoverEvolutionOutcomeTransaction({
    ...current, receiptsPath: RECEIPTS, outcomesPath: OUTCOMES, resolveRevision: revisionFor,
  }), /实际字节冲突/);
  assert.deepEqual(fs.readFileSync(path.join(current.rootDir, RECEIPTS)), before);
  assert.equal(fs.readFileSync(path.join(current.rootDir, OUTCOMES), 'utf8'), '');
});

test('journal 额外字段、非 canonical base64 或 digest 漂移 fail closed', (t) => {
  const variants = [
    { mutate: journal => { journal.unexpected = true; }, expected: /字段非法/ },
    { mutate: journal => { journal.receipts.suffixBase64 = ` ${journal.receipts.suffixBase64}`; resealJournal(journal); }, expected: /canonical base64/ },
    { mutate: journal => { journal.receipts.expectedSha256 = '0'.repeat(64); resealJournal(journal); }, expected: /digest\/size 绑定失败/ },
  ];
  for (const variant of variants) {
    const current = fixture(t);
    const input = transactionInput({
      ...current,
      overrides: { faultInjector: phase => { if (phase === 'after-journal') throw new Error('simulated crash'); } },
    });
    assert.throws(() => commitEvolutionOutcomeTransaction(input), /simulated crash/);
    const journal = JSON.parse(fs.readFileSync(current.controlPaths.journalPath, 'utf8'));
    variant.mutate(journal);
    fs.writeFileSync(current.controlPaths.journalPath, JSON.stringify(journal), { mode: 0o600 });
    assert.throws(() => recoverEvolutionOutcomeTransaction({
      ...current, receiptsPath: RECEIPTS, outcomesPath: OUTCOMES, resolveRevision: revisionFor,
    }), variant.expected);
    assert.equal(fs.readFileSync(path.join(current.rootDir, RECEIPTS), 'utf8'), '');
    assert.equal(fs.readFileSync(path.join(current.rootDir, OUTCOMES), 'utf8'), '');
  }
});

test('postcheck failure 明确报告 committed-but-postcheck-failed 并保留可恢复 journal', (t) => {
  const current = fixture(t);
  const input = transactionInput({ ...current, overrides: { postcheck: () => false } });
  assert.throws(() => commitEvolutionOutcomeTransaction(input), /committed-but-postcheck-failed/);
  assert.equal(fs.existsSync(current.controlPaths.journalPath), true);
  assert.deepEqual(fs.readFileSync(path.join(current.rootDir, RECEIPTS)), input.receiptSuffix);
  assert.deepEqual(fs.readFileSync(path.join(current.rootDir, OUTCOMES)), input.outcomeSuffix);
  const recovered = recoverEvolutionOutcomeTransaction({
    ...current, receiptsPath: RECEIPTS, outcomesPath: OUTCOMES, resolveRevision: revisionFor,
  });
  assert.equal(recovered.status, 'recovered');
  assert.equal(recovered.ledgerMutationPerformed, false);
  assert.deepEqual(recovered.ledgerMutations, { receipts: false, outcomes: false });
  assert.equal(fs.existsSync(current.controlPaths.journalPath), false);
});
