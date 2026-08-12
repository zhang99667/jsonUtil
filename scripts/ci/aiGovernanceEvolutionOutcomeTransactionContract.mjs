import { createHash } from 'node:crypto';
import path from 'node:path';

export const AI_EVOLUTION_OUTCOME_TRANSACTION_MAX_LEDGER_BYTES = 8 * 1024 * 1024;
export const AI_EVOLUTION_OUTCOME_TRANSACTION_MAX_SUFFIX_BYTES = 2 * 1024 * 1024;
export const AI_EVOLUTION_OUTCOME_TRANSACTION_MAX_JOURNAL_BYTES = 24 * 1024 * 1024;

const REVISION_PATTERN = /^(?:[0-9a-f]{40}|(?:worktree|commit|ci)-[0-9a-f]{40}|worktree-[0-9a-f]{64})$/;
const SHA256_PATTERN = /^[0-9a-f]{64}$/;
const ENDPOINT_FIELDS = ['dev', 'ino', 'mode', 'nlink', 'size', 'mtimeNs', 'ctimeNs', 'sha256'];
const ENTRY_FIELDS = ['path', 'baseEndpoint', 'baseBase64', 'suffixBase64', 'expectedSize', 'expectedSha256'];
const JOURNAL_FIELDS = ['schemaVersion', 'transactionId', 'revision', 'receipts', 'outcomes', 'transactionSha256'];
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const exactFields = (value, fields) => Boolean(value) && typeof value === 'object' && !Array.isArray(value)
  && Object.keys(value).sort().join('\0') === [...fields].sort().join('\0');
const journalDigest = value => sha256(Buffer.from(
  `jsonutils.ai-evolution.outcome-transaction/v1\0${JSON.stringify(value)}`,
));

export const isEvolutionOutcomeTransactionRevision = value => REVISION_PATTERN.test(value ?? '');

const canonicalBase64 = (value, label) => {
  if (typeof value !== 'string' || Buffer.from(value, 'base64').toString('base64') !== value) {
    throw new Error(`${label} 必须是 canonical base64`);
  }
  return Buffer.from(value, 'base64');
};

const validateEndpoint = (endpoint, label) => {
  if (!exactFields(endpoint, ENDPOINT_FIELDS)
    || !ENDPOINT_FIELDS.slice(0, -1).every(field => /^\d+$/.test(endpoint[field] ?? ''))
    || !SHA256_PATTERN.test(endpoint.sha256 ?? '') || endpoint.nlink !== '1') {
    throw new Error(`${label}.baseEndpoint 非法`);
  }
};

const decodeJournalEntry = (entry, label) => {
  if (!exactFields(entry, ENTRY_FIELDS) || typeof entry.path !== 'string'
    || entry.path.length === 0 || path.posix.normalize(entry.path) !== entry.path
    || path.posix.isAbsolute(entry.path) || entry.path.startsWith('../')) {
    throw new Error(`${label} 字段或路径非法`);
  }
  validateEndpoint(entry.baseEndpoint, label);
  const base = canonicalBase64(entry.baseBase64, `${label}.baseBase64`);
  const suffix = canonicalBase64(entry.suffixBase64, `${label}.suffixBase64`);
  if (base.length > AI_EVOLUTION_OUTCOME_TRANSACTION_MAX_LEDGER_BYTES || suffix.length === 0
    || suffix.length > AI_EVOLUTION_OUTCOME_TRANSACTION_MAX_SUFFIX_BYTES) {
    throw new Error(`${label} 字节越界`);
  }
  const expected = Buffer.concat([base, suffix]);
  if (expected.length > AI_EVOLUTION_OUTCOME_TRANSACTION_MAX_LEDGER_BYTES
    || entry.baseEndpoint.size !== String(base.length) || entry.baseEndpoint.sha256 !== sha256(base)
    || entry.expectedSize !== String(expected.length) || entry.expectedSha256 !== sha256(expected)) {
    throw new Error(`${label} digest/size 绑定失败`);
  }
  return { base, suffix, expected };
};

export const buildEvolutionOutcomeTransactionJournalEntry = (snapshot, suffix) => {
  if (!Buffer.isBuffer(suffix) || suffix.length === 0
    || suffix.length > AI_EVOLUTION_OUTCOME_TRANSACTION_MAX_SUFFIX_BYTES) {
    throw new Error('ledger suffix 必须是有界非空 Buffer');
  }
  if (!snapshot || typeof snapshot !== 'object' || !Buffer.isBuffer(snapshot.bytes)) {
    throw new Error('journal entry snapshot 非法');
  }
  const expected = Buffer.concat([snapshot.bytes, suffix]);
  if (expected.length > AI_EVOLUTION_OUTCOME_TRANSACTION_MAX_LEDGER_BYTES) {
    throw new Error('ledger transaction 超过大小上限');
  }
  const entry = {
    path: snapshot.relative,
    baseEndpoint: snapshot.endpoint,
    baseBase64: snapshot.bytes.toString('base64'),
    suffixBase64: suffix.toString('base64'),
    expectedSize: String(expected.length),
    expectedSha256: sha256(expected),
  };
  decodeJournalEntry(entry, 'journal entry');
  return entry;
};

export const buildEvolutionOutcomeTransactionJournal = ({ revision, receipts, outcomes }) => {
  if (!isEvolutionOutcomeTransactionRevision(revision)) throw new Error('outcome transaction journal 字段非法');
  decodeJournalEntry(receipts, 'journal.receipts');
  decodeJournalEntry(outcomes, 'journal.outcomes');
  const seed = { schemaVersion: 1, revision, receipts, outcomes };
  const transactionId = `txn-${journalDigest(seed).slice(0, 32)}`;
  const unsigned = { schemaVersion: 1, transactionId, revision, receipts, outcomes };
  return { ...unsigned, transactionSha256: journalDigest(unsigned) };
};

export const decodeEvolutionOutcomeTransactionJournal = (journal) => {
  if (!exactFields(journal, JOURNAL_FIELDS) || journal.schemaVersion !== 1
    || !/^txn-[0-9a-f]{32}$/.test(journal.transactionId ?? '')
    || !isEvolutionOutcomeTransactionRevision(journal.revision)
    || !SHA256_PATTERN.test(journal.transactionSha256 ?? '')) {
    throw new Error('outcome transaction journal 字段非法');
  }
  const unsigned = {
    schemaVersion: journal.schemaVersion, transactionId: journal.transactionId, revision: journal.revision,
    receipts: journal.receipts, outcomes: journal.outcomes,
  };
  if (journal.transactionSha256 !== journalDigest(unsigned)) {
    throw new Error('outcome transaction journal digest 不匹配');
  }
  const seed = {
    schemaVersion: journal.schemaVersion, revision: journal.revision,
    receipts: journal.receipts, outcomes: journal.outcomes,
  };
  if (journal.transactionId !== `txn-${journalDigest(seed).slice(0, 32)}`) {
    throw new Error('outcome transaction journal transactionId 不匹配');
  }
  return {
    journal,
    receipts: decodeJournalEntry(journal.receipts, 'journal.receipts'),
    outcomes: decodeJournalEntry(journal.outcomes, 'journal.outcomes'),
  };
};
