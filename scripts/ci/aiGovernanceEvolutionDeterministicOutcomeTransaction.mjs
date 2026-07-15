import { createHash, randomBytes } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { runHermeticGitInventory } from './aiGovernanceHermeticGitInventory.mjs';
import { buildEvolutionOutcomeRecoveryResult } from './aiGovernanceEvolutionOutcomeRecoveryResult.mjs';
export { getEvolutionOutcomeRecoveryMutationPerformed } from './aiGovernanceEvolutionOutcomeRecoveryResult.mjs';

const CONTROL_RELATIVE_PATH = 'jsonutils-ai-governance/outcome-writer';
const LOCK_FILE = 'writer.lock';
const JOURNAL_FILE = 'transaction.json';
const MAX_LEDGER_BYTES = 8 * 1024 * 1024;
const MAX_SUFFIX_BYTES = 2 * 1024 * 1024;
const MAX_JOURNAL_BYTES = 24 * 1024 * 1024;
const REVISION_PATTERN = /^(?:[0-9a-f]{40}|(?:worktree|commit|ci)-[0-9a-f]{40}|worktree-[0-9a-f]{64})$/;
const SHA256_PATTERN = /^[0-9a-f]{64}$/;
const ENDPOINT_FIELDS = ['dev', 'ino', 'mode', 'nlink', 'size', 'mtimeNs', 'ctimeNs', 'sha256'];
const ENTRY_FIELDS = ['path', 'baseEndpoint', 'baseBase64', 'suffixBase64', 'expectedSize', 'expectedSha256'];
const JOURNAL_FIELDS = ['schemaVersion', 'transactionId', 'revision', 'receipts', 'outcomes', 'transactionSha256'];
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const exactFields = (value, fields) => Boolean(value) && typeof value === 'object' && !Array.isArray(value)
  && Object.keys(value).sort().join('\0') === [...fields].sort().join('\0');
const isWithin = (parent, child) => {
  const relative = path.relative(parent, child);
  return relative === '' || (!relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative));
};
const fsyncDirectory = directory => {
  const descriptor = fs.openSync(directory, fs.constants.O_RDONLY);
  try { fs.fsyncSync(descriptor); } finally { fs.closeSync(descriptor); }
};

const ensurePrivateDirectory = (directory) => {
  const missing = [];
  let cursor = directory;
  while (!fs.existsSync(cursor)) {
    missing.push(cursor);
    const parent = path.dirname(cursor);
    if (parent === cursor) throw new Error('outcome writer control dir 无可验证父目录');
    cursor = parent;
  }
  const existingReal = fs.realpathSync(cursor);
  if (existingReal !== cursor || !fs.lstatSync(cursor).isDirectory()) {
    throw new Error('outcome writer control dir ancestor 不得是 symlink');
  }
  missing.reverse().forEach((item) => {
    fs.mkdirSync(item, { mode: 0o700 });
    fs.chmodSync(item, 0o700);
  });
  const stat = fs.lstatSync(directory);
  if (stat.isSymbolicLink() || !stat.isDirectory() || fs.realpathSync(directory) !== directory) {
    throw new Error('outcome writer control dir 必须是普通目录');
  }
  if ((stat.mode & 0o777) !== 0o700) throw new Error('outcome writer control dir 必须为 0700');
  if (typeof process.getuid === 'function' && stat.uid !== process.getuid()) {
    throw new Error('outcome writer control dir 必须由当前用户持有');
  }
};

const resolveControlDirectory = (rootDir) => {
  const realRoot = fs.realpathSync(rootDir);
  const output = runHermeticGitInventory(realRoot, [
    'rev-parse', '--path-format=absolute', '--git-path', CONTROL_RELATIVE_PATH,
  ]).toString('utf8').trim();
  if (!path.isAbsolute(output) || output.includes('\n') || output.includes('\0')) {
    throw new Error('hermetic Git 未返回合法 outcome writer control dir');
  }
  return path.normalize(output);
};

const writeExclusiveFile = (file, bytes, mode) => {
  const descriptor = fs.openSync(file, fs.constants.O_CREAT | fs.constants.O_EXCL | fs.constants.O_WRONLY, mode);
  try {
    const written = fs.writeSync(descriptor, bytes, 0, bytes.length, null);
    if (written !== bytes.length) throw new Error('owner-only control file 发生 short write');
    fs.fsyncSync(descriptor);
  } finally {
    fs.closeSync(descriptor);
  }
};

const readPrivateCompactJson = (file, maxBytes, label) => {
  const stat = fs.lstatSync(file, { bigint: true });
  if (stat.isSymbolicLink() || !stat.isFile() || stat.nlink !== 1n) throw new Error(`${label} 必须是普通单链接文件`);
  if ((stat.mode & 0o077n) !== 0n || stat.size <= 0n || stat.size > BigInt(maxBytes)) throw new Error(`${label} 权限或大小非法`);
  if (typeof process.getuid === 'function' && stat.uid !== BigInt(process.getuid())) throw new Error(`${label} 必须由当前用户持有`);
  const descriptor = fs.openSync(file, fs.constants.O_RDONLY | (fs.constants.O_NOFOLLOW ?? 0));
  try {
    const opened = fs.fstatSync(descriptor, { bigint: true });
    if (!opened.isFile() || opened.nlink !== 1n || opened.dev !== stat.dev || opened.ino !== stat.ino) {
      throw new Error(`${label} 在打开期间被替换`);
    }
    const bytes = fs.readFileSync(descriptor);
    const text = bytes.toString('utf8');
    const value = JSON.parse(text);
    if (text !== JSON.stringify(value)) throw new Error(`${label} 必须是精确紧凑 JSON`);
    return value;
  } catch (error) {
    if (error instanceof SyntaxError) throw new Error(`${label} 不完整或不是合法 JSON`);
    throw error;
  } finally {
    fs.closeSync(descriptor);
  }
};

const pidIsAlive = (pid) => {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    if (error.code === 'EPERM') return true;
    if (error.code === 'ESRCH') return false;
    throw error;
  }
};

const releaseWriterLock = (controlPaths) => {
  if (!controlPaths?.token || !fs.existsSync(controlPaths.lockPath)) return;
  const metadata = readPrivateCompactJson(controlPaths.lockPath, 4096, 'outcome writer lock');
  if (metadata.token !== controlPaths.token) throw new Error('outcome writer lock ownership 已漂移');
  fs.unlinkSync(controlPaths.lockPath);
  fsyncDirectory(controlPaths.controlDir);
};

export const acquireEvolutionOutcomeWriterLock = ({ rootDir, hostname = os.hostname(), pid = process.pid }) => {
  if (!Number.isSafeInteger(pid) || pid <= 0 || typeof hostname !== 'string' || !hostname.trim()) {
    throw new Error('outcome writer lock pid/hostname 非法');
  }
  const controlDir = resolveControlDirectory(rootDir);
  ensurePrivateDirectory(controlDir);
  const lockPath = path.join(controlDir, LOCK_FILE);
  const journalPath = path.join(controlDir, JOURNAL_FILE);
  for (;;) {
    const token = randomBytes(16).toString('hex');
    const metadata = { schemaVersion: 1, pid, hostname, token };
    try {
      writeExclusiveFile(lockPath, Buffer.from(JSON.stringify(metadata)), 0o600);
      fsyncDirectory(controlDir);
      const controlPaths = { controlDir, lockPath, journalPath, token };
      return { ...controlPaths, release: () => releaseWriterLock(controlPaths) };
    } catch (error) {
      if (error.code !== 'EEXIST') throw error;
      const existing = readPrivateCompactJson(lockPath, 4096, 'outcome writer lock');
      if (!exactFields(existing, ['schemaVersion', 'pid', 'hostname', 'token']) || existing.schemaVersion !== 1
        || !Number.isSafeInteger(existing.pid) || existing.pid <= 0 || typeof existing.hostname !== 'string'
        || !/^[0-9a-f]{32}$/.test(existing.token ?? '')) {
        throw new Error('outcome writer lock metadata 非法，禁止自动破锁');
      }
      if (existing.hostname !== hostname) throw new Error('outcome writer lock 来自其它 host，禁止自动破锁');
      if (pidIsAlive(existing.pid)) throw new Error('已有 live outcome writer 持有 lock');
      const stale = `${lockPath}.stale-${token}`;
      try {
        fs.renameSync(lockPath, stale);
      } catch (renameError) {
        if (renameError.code === 'ENOENT') continue;
        throw renameError;
      }
      fsyncDirectory(controlDir);
      fs.unlinkSync(stale);
      fsyncDirectory(controlDir);
    }
  }
};

export const readEvolutionOutcomeLedgerSnapshot = (rootDir, filePath) => {
  const realRoot = fs.realpathSync(rootDir);
  const absolute = path.isAbsolute(filePath) ? path.normalize(filePath) : path.join(realRoot, filePath);
  if (!isWithin(realRoot, absolute)) throw new Error('ledger 必须位于 worktree 内');
  const resolved = fs.realpathSync(absolute);
  if (resolved !== absolute) throw new Error('ledger ancestor/direct symlink 被拒绝');
  const before = fs.lstatSync(absolute, { bigint: true });
  if (before.isSymbolicLink() || !before.isFile() || before.nlink !== 1n) {
    throw new Error('ledger 必须是普通单链接非 symlink 文件');
  }
  if (before.size > BigInt(MAX_LEDGER_BYTES)) throw new Error('ledger 超过大小上限');
  const descriptor = fs.openSync(absolute, fs.constants.O_RDONLY | (fs.constants.O_NOFOLLOW ?? 0));
  try {
    const opened = fs.fstatSync(descriptor, { bigint: true });
    if (!opened.isFile() || opened.nlink !== 1n || opened.dev !== before.dev || opened.ino !== before.ino) {
      throw new Error('ledger 在打开期间被替换');
    }
    const bytes = fs.readFileSync(descriptor);
    const after = fs.fstatSync(descriptor, { bigint: true });
    for (const field of ['dev', 'ino', 'mode', 'nlink', 'size', 'mtimeNs', 'ctimeNs']) {
      if (opened[field] !== after[field]) throw new Error('ledger 在读取期间发生漂移');
    }
    return {
      absolute,
      relative: path.relative(realRoot, absolute).split(path.sep).join('/'),
      bytes,
      endpoint: {
        dev: after.dev.toString(), ino: after.ino.toString(), mode: after.mode.toString(),
        nlink: after.nlink.toString(), size: after.size.toString(), mtimeNs: after.mtimeNs.toString(),
        ctimeNs: after.ctimeNs.toString(), sha256: sha256(bytes),
      },
    };
  } finally {
    fs.closeSync(descriptor);
  }
};

const safeLedgerSnapshot = readEvolutionOutcomeLedgerSnapshot;

const assertDistinctLedgers = (receipts, outcomes) => {
  if (receipts.endpoint.dev === outcomes.endpoint.dev && receipts.endpoint.ino === outcomes.endpoint.ino) {
    throw new Error('receipt/outcome ledger 不得指向同一 inode');
  }
};

const canonicalBase64 = (value, label) => {
  if (typeof value !== 'string' || Buffer.from(value, 'base64').toString('base64') !== value) {
    throw new Error(`${label} 必须是 canonical base64`);
  }
  return Buffer.from(value, 'base64');
};

const buildJournalEntry = (snapshot, suffix) => {
  if (!Buffer.isBuffer(suffix) || suffix.length === 0 || suffix.length > MAX_SUFFIX_BYTES) {
    throw new Error('ledger suffix 必须是有界非空 Buffer');
  }
  const expected = Buffer.concat([snapshot.bytes, suffix]);
  if (expected.length > MAX_LEDGER_BYTES) throw new Error('ledger transaction 超过大小上限');
  return {
    path: snapshot.relative,
    baseEndpoint: snapshot.endpoint,
    baseBase64: snapshot.bytes.toString('base64'),
    suffixBase64: suffix.toString('base64'),
    expectedSize: String(expected.length),
    expectedSha256: sha256(expected),
  };
};

const journalDigest = value => sha256(Buffer.from(`jsonutils.ai-evolution.outcome-transaction/v1\0${JSON.stringify(value)}`));

const buildJournal = ({ revision, receipts, outcomes }) => {
  const seed = { schemaVersion: 1, revision, receipts, outcomes };
  const transactionId = `txn-${journalDigest(seed).slice(0, 32)}`;
  const unsigned = { schemaVersion: 1, transactionId, revision, receipts, outcomes };
  return { ...unsigned, transactionSha256: journalDigest(unsigned) };
};

const validateEndpoint = (endpoint, label) => {
  if (!exactFields(endpoint, ENDPOINT_FIELDS) || !ENDPOINT_FIELDS.slice(0, -1).every(field => /^\d+$/.test(endpoint[field] ?? ''))
    || !SHA256_PATTERN.test(endpoint.sha256 ?? '') || endpoint.nlink !== '1') {
    throw new Error(`${label}.baseEndpoint 非法`);
  }
};

const validateJournalEntry = (entry, label) => {
  if (!exactFields(entry, ENTRY_FIELDS) || typeof entry.path !== 'string' || path.posix.normalize(entry.path) !== entry.path
    || path.posix.isAbsolute(entry.path) || entry.path.startsWith('../')) throw new Error(`${label} 字段或路径非法`);
  validateEndpoint(entry.baseEndpoint, label);
  const base = canonicalBase64(entry.baseBase64, `${label}.baseBase64`);
  const suffix = canonicalBase64(entry.suffixBase64, `${label}.suffixBase64`);
  if (base.length > MAX_LEDGER_BYTES || suffix.length === 0 || suffix.length > MAX_SUFFIX_BYTES) throw new Error(`${label} 字节越界`);
  const expected = Buffer.concat([base, suffix]);
  if (entry.baseEndpoint.size !== String(base.length) || entry.baseEndpoint.sha256 !== sha256(base)
    || entry.expectedSize !== String(expected.length) || entry.expectedSha256 !== sha256(expected)) {
    throw new Error(`${label} digest/size 绑定失败`);
  }
  return { base, suffix, expected };
};

const readJournal = (journalPath) => {
  const journal = readPrivateCompactJson(journalPath, MAX_JOURNAL_BYTES, 'outcome transaction journal');
  if (!exactFields(journal, JOURNAL_FIELDS) || journal.schemaVersion !== 1
    || !/^txn-[0-9a-f]{32}$/.test(journal.transactionId ?? '') || !REVISION_PATTERN.test(journal.revision ?? '')
    || !SHA256_PATTERN.test(journal.transactionSha256 ?? '')) throw new Error('outcome transaction journal 字段非法');
  const unsigned = { schemaVersion: journal.schemaVersion, transactionId: journal.transactionId, revision: journal.revision,
    receipts: journal.receipts, outcomes: journal.outcomes };
  if (journal.transactionSha256 !== journalDigest(unsigned)) throw new Error('outcome transaction journal digest 不匹配');
  const seed = { schemaVersion: journal.schemaVersion, revision: journal.revision,
    receipts: journal.receipts, outcomes: journal.outcomes };
  if (journal.transactionId !== `txn-${journalDigest(seed).slice(0, 32)}`) {
    throw new Error('outcome transaction journal transactionId 不匹配');
  }
  return {
    journal,
    receipts: validateJournalEntry(journal.receipts, 'journal.receipts'),
    outcomes: validateJournalEntry(journal.outcomes, 'journal.outcomes'),
  };
};

const writeJournal = (controlPaths, journal) => {
  if (fs.existsSync(controlPaths.journalPath)) throw new Error('存在未恢复的 outcome transaction journal');
  const temporary = path.join(controlPaths.controlDir, `transaction-${randomBytes(16).toString('hex')}.tmp`);
  const bytes = Buffer.from(JSON.stringify(journal));
  if (bytes.length > MAX_JOURNAL_BYTES) throw new Error('outcome transaction journal 超过大小上限');
  writeExclusiveFile(temporary, bytes, 0o600);
  try {
    fs.renameSync(temporary, controlPaths.journalPath);
    fsyncDirectory(controlPaths.controlDir);
  } catch (error) {
    if (fs.existsSync(temporary)) fs.unlinkSync(temporary);
    throw error;
  }
};

const endpointIdentityMatches = (snapshot, endpoint) => ['dev', 'ino', 'mode', 'nlink']
  .every(field => snapshot.endpoint[field] === endpoint[field]);
const fullBaseEndpointMatches = (snapshot, endpoint) => ENDPOINT_FIELDS.every(field => snapshot.endpoint[field] === endpoint[field]);

const classifyBytes = (current, base, expected) => {
  if (current.equals(base)) return 'base';
  if (current.equals(expected)) return 'expected';
  if (current.length > base.length && current.length < expected.length && expected.subarray(0, current.length).equals(current)) return 'prefix';
  return 'invalid';
};

const appendRemaining = (rootDir, filePath, journalEntry, decoded) => {
  const snapshot = safeLedgerSnapshot(rootDir, filePath);
  if (!endpointIdentityMatches(snapshot, journalEntry.baseEndpoint)) throw new Error(`${journalEntry.path}: ledger identity/mode 漂移`);
  const state = classifyBytes(snapshot.bytes, decoded.base, decoded.expected);
  if (!['base', 'prefix'].includes(state)) return state;
  if (state === 'base' && !fullBaseEndpointMatches(snapshot, journalEntry.baseEndpoint)) {
    throw new Error(`${journalEntry.path}: ledger base endpoint 漂移`);
  }
  const remaining = decoded.expected.subarray(snapshot.bytes.length);
  const descriptor = fs.openSync(snapshot.absolute, fs.constants.O_WRONLY | fs.constants.O_APPEND | (fs.constants.O_NOFOLLOW ?? 0));
  try {
    const opened = fs.fstatSync(descriptor, { bigint: true });
    if (opened.dev.toString() !== journalEntry.baseEndpoint.dev || opened.ino.toString() !== journalEntry.baseEndpoint.ino
      || opened.mode.toString() !== journalEntry.baseEndpoint.mode || opened.nlink !== 1n) {
      throw new Error(`${journalEntry.path}: append open endpoint 漂移`);
    }
    const written = fs.writeSync(descriptor, remaining, 0, remaining.length, null);
    if (written !== remaining.length) throw new Error(`${journalEntry.path}: append short write`);
    fs.fsyncSync(descriptor);
  } finally {
    fs.closeSync(descriptor);
  }
  const after = safeLedgerSnapshot(rootDir, filePath);
  if (!after.bytes.equals(decoded.expected) || !endpointIdentityMatches(after, journalEntry.baseEndpoint)) {
    throw new Error(`${journalEntry.path}: append 后字节不匹配`);
  }
  return 'expected';
};

const removeJournal = (controlPaths) => {
  fs.unlinkSync(controlPaths.journalPath);
  fsyncDirectory(controlPaths.controlDir);
};

const assertControlLock = (controlPaths) => {
  const metadata = readPrivateCompactJson(controlPaths.lockPath, 4096, 'outcome writer lock');
  if (metadata.token !== controlPaths.token) throw new Error('当前调用未持有 outcome writer lock');
};

export const recoverEvolutionOutcomeTransaction = ({
  rootDir, controlPaths, receiptsPath, outcomesPath, resolveRevision,
}) => {
  assertControlLock(controlPaths);
  if (!fs.existsSync(controlPaths.journalPath)) return buildEvolutionOutcomeRecoveryResult({ status: 'none' });
  const decoded = readJournal(controlPaths.journalPath);
  const receipts = safeLedgerSnapshot(rootDir, receiptsPath);
  const outcomes = safeLedgerSnapshot(rootDir, outcomesPath);
  assertDistinctLedgers(receipts, outcomes);
  if (decoded.journal.receipts.path !== receipts.relative || decoded.journal.outcomes.path !== outcomes.relative) {
    throw new Error('outcome transaction journal ledger path 不匹配');
  }
  if (!endpointIdentityMatches(receipts, decoded.journal.receipts.baseEndpoint)
    || !endpointIdentityMatches(outcomes, decoded.journal.outcomes.baseEndpoint)) {
    throw new Error('outcome transaction ledger identity/mode 已替换');
  }
  let receiptState = classifyBytes(receipts.bytes, decoded.receipts.base, decoded.receipts.expected);
  let outcomeState = classifyBytes(outcomes.bytes, decoded.outcomes.base, decoded.outcomes.expected);
  if (receiptState === 'invalid' || outcomeState === 'invalid' || (receiptState !== 'expected' && outcomeState !== 'base')) {
    throw new Error('outcome transaction journal 与 ledger 实际字节冲突');
  }
  if (receiptState === 'base' && outcomeState === 'base') {
    if (!fullBaseEndpointMatches(receipts, decoded.journal.receipts.baseEndpoint)
      || !fullBaseEndpointMatches(outcomes, decoded.journal.outcomes.baseEndpoint)) {
      throw new Error('outcome transaction base endpoint 已漂移');
    }
    if (resolveRevision(rootDir) !== decoded.journal.revision) {
      removeJournal(controlPaths);
      return buildEvolutionOutcomeRecoveryResult({
        status: 'abandoned-source-drift', transactionId: decoded.journal.transactionId,
      });
    }
  }
  const receiptMutationPerformed = receiptState !== 'expected';
  if (receiptState !== 'expected') receiptState = appendRemaining(rootDir, receiptsPath, decoded.journal.receipts, decoded.receipts);
  if (receiptState !== 'expected') throw new Error('receipt ledger 未恢复到 expected');
  const refreshedOutcome = safeLedgerSnapshot(rootDir, outcomesPath);
  outcomeState = classifyBytes(refreshedOutcome.bytes, decoded.outcomes.base, decoded.outcomes.expected);
  if (!['base', 'prefix', 'expected'].includes(outcomeState)) throw new Error('outcome ledger 恢复状态非法');
  const outcomeMutationPerformed = outcomeState !== 'expected';
  if (outcomeState !== 'expected') outcomeState = appendRemaining(rootDir, outcomesPath, decoded.journal.outcomes, decoded.outcomes);
  if (outcomeState !== 'expected') throw new Error('outcome ledger 未恢复到 expected');
  const stale = resolveRevision(rootDir) !== decoded.journal.revision;
  removeJournal(controlPaths);
  return buildEvolutionOutcomeRecoveryResult({
    status: stale ? 'recovered-stale' : 'recovered', transactionId: decoded.journal.transactionId,
    receipts: receiptMutationPerformed, outcomes: outcomeMutationPerformed,
  });
};

export const commitEvolutionOutcomeTransaction = ({
  rootDir, controlPaths, revision, receiptsPath, outcomesPath, receiptsBase, outcomesBase,
  receiptSuffix, outcomeSuffix, resolveRevision, postcheck, faultInjector = () => {},
}) => {
  assertControlLock(controlPaths);
  if (!REVISION_PATTERN.test(revision ?? '') || typeof resolveRevision !== 'function' || typeof postcheck !== 'function') {
    throw new Error('outcome transaction revision/回调非法');
  }
  if (fs.existsSync(controlPaths.journalPath)) throw new Error('存在未恢复的 outcome transaction journal');
  const receipts = safeLedgerSnapshot(rootDir, receiptsPath);
  const outcomes = safeLedgerSnapshot(rootDir, outcomesPath);
  assertDistinctLedgers(receipts, outcomes);
  if (!Buffer.isBuffer(receiptsBase) || !receipts.bytes.equals(receiptsBase)
    || !Buffer.isBuffer(outcomesBase) || !outcomes.bytes.equals(outcomesBase)) {
    throw new Error('outcome transaction ledger base bytes 已漂移');
  }
  if (resolveRevision(rootDir) !== revision) throw new Error('outcome transaction source revision 已漂移');
  const journal = buildJournal({
    revision,
    receipts: buildJournalEntry(receipts, receiptSuffix),
    outcomes: buildJournalEntry(outcomes, outcomeSuffix),
  });
  writeJournal(controlPaths, journal);
  faultInjector('after-journal');
  const beforeReceipt = safeLedgerSnapshot(rootDir, receiptsPath);
  const beforeOutcome = safeLedgerSnapshot(rootDir, outcomesPath);
  if (!fullBaseEndpointMatches(beforeReceipt, journal.receipts.baseEndpoint)
    || !fullBaseEndpointMatches(beforeOutcome, journal.outcomes.baseEndpoint)
    || resolveRevision(rootDir) !== revision) {
    removeJournal(controlPaths);
    throw new Error('outcome transaction 临写前 source/endpoint 漂移');
  }
  const decoded = readJournal(controlPaths.journalPath);
  appendRemaining(rootDir, receiptsPath, journal.receipts, decoded.receipts);
  faultInjector('after-receipt');
  appendRemaining(rootDir, outcomesPath, journal.outcomes, decoded.outcomes);
  faultInjector('after-outcome');
  try {
    const result = postcheck();
    if (result === false || result?.ok === false) throw new Error('postcheck 返回失败');
  } catch (error) {
    throw new Error(`committed-but-postcheck-failed: ${error.message}`);
  }
  removeJournal(controlPaths);
  return { status: 'committed', transactionId: journal.transactionId };
};
