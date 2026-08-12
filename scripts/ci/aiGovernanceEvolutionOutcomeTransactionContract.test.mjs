import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { test } from 'node:test';

import {
  buildEvolutionOutcomeTransactionJournal,
  buildEvolutionOutcomeTransactionJournalEntry,
  decodeEvolutionOutcomeTransactionJournal,
} from './aiGovernanceEvolutionOutcomeTransactionContract.mjs';

const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const journalDigest = value => sha256(Buffer.from(
  `jsonutils.ai-evolution.outcome-transaction/v1\0${JSON.stringify(value)}`,
));
const resealJournal = (journal) => {
  const seed = {
    schemaVersion: journal.schemaVersion, revision: journal.revision,
    receipts: journal.receipts, outcomes: journal.outcomes,
  };
  journal.transactionId = `txn-${journalDigest(seed).slice(0, 32)}`;
  const unsigned = {
    schemaVersion: journal.schemaVersion, transactionId: journal.transactionId,
    revision: journal.revision, receipts: journal.receipts, outcomes: journal.outcomes,
  };
  journal.transactionSha256 = journalDigest(unsigned);
  return journal;
};
const endpointFor = (bytes, ino) => ({
  dev: '1', ino, mode: '33152', nlink: '1', size: String(bytes.length),
  mtimeNs: '2', ctimeNs: '3', sha256: sha256(bytes),
});
const snapshotFor = (relative, text, ino) => {
  const bytes = Buffer.from(text);
  return { relative, bytes, endpoint: endpointFor(bytes, ino) };
};

test('transaction contract 单源派生 entry、稳定 journal 身份与精确字节', () => {
  const receipts = buildEvolutionOutcomeTransactionJournalEntry(
    snapshotFor('evals/ai-governance/trial-receipts.jsonl', '{"old":1}\n', '10'),
    Buffer.from('{"receipt":1}\n'),
  );
  const outcomes = buildEvolutionOutcomeTransactionJournalEntry(
    snapshotFor('evals/ai-governance/outcomes.jsonl', '{"old":2}\n', '11'),
    Buffer.from('{"outcome":1}\n'),
  );
  const journal = buildEvolutionOutcomeTransactionJournal({
    revision: `worktree-${'a'.repeat(64)}`, receipts, outcomes,
  });
  const decoded = decodeEvolutionOutcomeTransactionJournal(journal);

  assert.deepEqual(Object.keys(journal), [
    'schemaVersion', 'transactionId', 'revision', 'receipts', 'outcomes', 'transactionSha256',
  ]);
  assert.equal(journal.transactionId, 'txn-7e2454db441af6d05dd5d0724ad903ae');
  assert.equal(decoded.journal, journal);
  assert.deepEqual(decoded.receipts.base, Buffer.from('{"old":1}\n'));
  assert.deepEqual(decoded.receipts.suffix, Buffer.from('{"receipt":1}\n'));
  assert.deepEqual(decoded.receipts.expected, Buffer.from('{"old":1}\n{"receipt":1}\n'));
  assert.deepEqual(decoded.outcomes.expected, Buffer.from('{"old":2}\n{"outcome":1}\n'));
});

test('transaction contract 对字段、路径、base64、digest 与 suffix 边界 fail closed', () => {
  const snapshot = snapshotFor('evals/ai-governance/trial-receipts.jsonl', '', '10');
  assert.throws(
    () => buildEvolutionOutcomeTransactionJournalEntry(snapshot, Buffer.alloc(0)),
    /ledger suffix 必须是有界非空 Buffer/,
  );
  assert.throws(
    () => buildEvolutionOutcomeTransactionJournalEntry({ ...snapshot, relative: '../outside.jsonl' }, Buffer.from('x')),
    /字段或路径非法/,
  );

  const entry = buildEvolutionOutcomeTransactionJournalEntry(snapshot, Buffer.from('{"receipt":1}\n'));
  const baseJournal = buildEvolutionOutcomeTransactionJournal({
    revision: `worktree-${'b'.repeat(64)}`, receipts: entry,
    outcomes: buildEvolutionOutcomeTransactionJournalEntry(
      snapshotFor('evals/ai-governance/outcomes.jsonl', '', '11'), Buffer.from('{"outcome":1}\n'),
    ),
  });
  const invalid = [
    [{ ...baseJournal, unexpected: true }, /字段非法/],
    [{ ...baseJournal, revision: 'caller-controlled' }, /字段非法/],
    [resealJournal({
      ...baseJournal,
      receipts: { ...baseJournal.receipts, suffixBase64: ` ${baseJournal.receipts.suffixBase64}` },
    }), /canonical base64/],
    [resealJournal({
      ...baseJournal,
      receipts: { ...baseJournal.receipts, expectedSha256: '0'.repeat(64) },
    }), /digest\/size 绑定失败/],
    [{ ...baseJournal, transactionSha256: '0'.repeat(64) }, /journal digest 不匹配/],
  ];
  invalid.forEach(([value, expected]) => assert.throws(
    () => decodeEvolutionOutcomeTransactionJournal(value),
    expected,
  ));
});
