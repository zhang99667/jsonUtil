// 从 HEAD、index 和工作树原始字节构建不依赖聚合状态的权威变更集。

import { createHash } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { TextDecoder } from 'node:util';

import {
  decodeHermeticGitNulRecords,
  isSafeHermeticGitPath,
  runHermeticGitInventory,
} from './aiGovernanceHermeticGitInventory.mjs';

const OID_PATTERN = '(?:[0-9a-f]{40}|[0-9a-f]{64})';
const NORMAL_MODES = new Set(['100644', '100755']);
const CHANGE_ORDER = [
  'staged-added', 'staged-deleted', 'staged-content', 'staged-mode',
  'worktree-deleted', 'worktree-content', 'worktree-mode', 'untracked',
];
const INTENT_TO_ADD_FLAG = 0x20000000n;
const STATE_DIGEST_DOMAIN = 'jsonutils-validation-changed-set-state-v1\0';
const strictUtf8 = new TextDecoder('utf-8', { fatal: true });

class InventoryError extends Error {
  constructor(code) {
    super(code);
    this.code = code;
  }
}

const decodeRecords = (buffer) => {
  try {
    return decodeHermeticGitNulRecords(buffer);
  } catch {
    throw new InventoryError('invalid-nul-or-utf8');
  }
};

const requireSafePath = (value) => {
  if (!isSafeHermeticGitPath(value)) throw new InventoryError('unsafe-path');
  return value;
};

const parseEntries = (buffer, pattern, buildEntry) => decodeRecords(buffer).map((record) => {
  const match = record.match(pattern);
  if (!match) throw new InventoryError('invalid-git-entry');
  return buildEntry(match, requireSafePath(match.at(-1)));
});

export const parseValidationHeadEntries = buffer => parseEntries(
  buffer,
  new RegExp(`^([0-7]{6}) ([a-z]+) (${OID_PATTERN}) (.+)$`, 's'),
  (match, file) => ({ mode: match[1], type: match[2], oid: match[3], path: file }),
);

export const parseValidationIndexEntries = buffer => parseEntries(
  buffer,
  new RegExp(`^([0-7]{6}) (${OID_PATTERN}) ([0-3]) (.+)$`, 's'),
  (match, file) => ({ mode: match[1], oid: match[2], stage: Number(match[3]), path: file }),
);

const parseTaggedPaths = (buffer) => {
  const tags = new Map();
  decodeRecords(buffer).forEach((record) => {
    if (!/^[A-Za-z?] /s.test(record)) throw new InventoryError('invalid-index-flags');
    const file = requireSafePath(record.slice(2));
    if (!tags.has(file)) tags.set(file, new Set());
    tags.get(file).add(record[0]);
  });
  return tags;
};

const parseIndexDebugFlags = (buffer, entries) => {
  const byPath = new Map();
  let offset = 0;
  entries.forEach((entry) => {
    const pathBytes = Buffer.from(entry.path, 'utf8');
    if (!buffer.subarray(offset, offset + pathBytes.length).equals(pathBytes)
      || buffer[offset + pathBytes.length] !== 0) throw new InventoryError('invalid-index-debug');
    offset += pathBytes.length + 1;
    const metadataStart = offset;
    for (let line = 0; line < 5; line += 1) {
      const newline = buffer.indexOf(0x0a, offset);
      if (newline < 0) throw new InventoryError('invalid-index-debug');
      offset = newline + 1;
    }
    const metadata = buffer.subarray(metadataStart, offset).toString('ascii');
    const match = metadata.match(/^  ctime: \d+:\d+\n  mtime: \d+:\d+\n  dev: \d+\tino: \d+\n  uid: \d+\tgid: \d+\n  size: \d+\tflags: ([0-9a-f]+)\n$/);
    if (!match) throw new InventoryError('invalid-index-debug');
    byPath.set(entry.path, (byPath.get(entry.path) ?? 0n) | BigInt(`0x${match[1]}`));
  });
  if (offset !== buffer.length) throw new InventoryError('invalid-index-debug');
  return byPath;
};

const mapUniqueEntries = (entries) => {
  const result = new Map();
  entries.forEach((entry) => {
    if (result.has(entry.path)) throw new InventoryError('duplicate-head-path');
    result.set(entry.path, entry);
  });
  return result;
};

const groupIndexEntries = (entries) => {
  const result = new Map();
  entries.forEach((entry) => {
    if (!result.has(entry.path)) result.set(entry.path, []);
    result.get(entry.path).push(entry);
  });
  return result;
};

const assertFlagInventory = (indexPaths, ...flagMaps) => {
  flagMaps.forEach((flags) => {
    if (flags.size !== indexPaths.size
      || [...indexPaths].some(file => !flags.has(file))) throw new InventoryError('index-flags-mismatch');
  });
};

const sameStableStat = (left, right) => left.dev === right.dev && left.ino === right.ino
  && left.mode === right.mode && left.size === right.size && left.nlink === right.nlink
  && left.uid === right.uid && left.gid === right.gid
  && left.mtimeNs === right.mtimeNs && left.ctimeNs === right.ctimeNs;

const worktreeMode = stat => ((stat.mode & 0o111n) === 0n ? '100644' : '100755');

const stableStatRecord = stat => ({
  dev: stat.dev.toString(),
  ino: stat.ino.toString(),
  mode: stat.mode.toString(8),
  nlink: stat.nlink.toString(),
  uid: stat.uid.toString(),
  gid: stat.gid.toString(),
  size: stat.size.toString(),
  mtimeNs: stat.mtimeNs.toString(),
  ctimeNs: stat.ctimeNs.toString(),
});

const decodeSingleLine = (buffer, code) => {
  let value;
  try {
    value = strictUtf8.decode(buffer);
  } catch {
    throw new InventoryError(code);
  }
  if (!value.endsWith('\n') || value.slice(0, -1).includes('\n') || value.includes('\r') || value.includes('\0')) {
    throw new InventoryError(code);
  }
  return value.slice(0, -1);
};

const assertRepositoryRoot = (realRoot) => {
  const declaredRoot = decodeSingleLine(runHermeticGitInventory(realRoot, [
    'rev-parse', '--path-format=absolute', '--show-toplevel',
  ]), 'repository-root-invalid');
  let canonicalRoot;
  try {
    canonicalRoot = fs.realpathSync(declaredRoot);
  } catch {
    throw new InventoryError('repository-root-invalid');
  }
  if (canonicalRoot !== realRoot) throw new InventoryError('repository-root-required');
};

const readStableFileDigest = (absolute, code) => {
  let pathStat;
  try {
    pathStat = fs.lstatSync(absolute, { bigint: true });
    if (!pathStat.isFile() || pathStat.isSymbolicLink() || pathStat.nlink !== 1n
      || fs.realpathSync(absolute) !== absolute) throw new Error('unsafe');
    const descriptor = fs.openSync(absolute, fs.constants.O_RDONLY | (fs.constants.O_NOFOLLOW ?? 0));
    try {
      const before = fs.fstatSync(descriptor, { bigint: true });
      if (!before.isFile() || !sameStableStat(pathStat, before)) throw new Error('unstable');
      const digest = createHash('sha256');
      const chunk = Buffer.allocUnsafe(64 * 1024);
      let total = 0n;
      for (;;) {
        const count = fs.readSync(descriptor, chunk, 0, chunk.length, null);
        if (count === 0) break;
        digest.update(chunk.subarray(0, count));
        total += BigInt(count);
      }
      const after = fs.fstatSync(descriptor, { bigint: true });
      const finalPathStat = fs.lstatSync(absolute, { bigint: true });
      if (total !== after.size || !sameStableStat(before, after) || !sameStableStat(after, finalPathStat)
        || fs.realpathSync(absolute) !== absolute) throw new Error('unstable');
      return { sha256: digest.digest('hex'), stat: stableStatRecord(after) };
    } finally {
      fs.closeSync(descriptor);
    }
  } catch {
    throw new InventoryError(code);
  }
};

const captureRawInventory = (realRoot) => {
  const indexPath = decodeSingleLine(runHermeticGitInventory(realRoot, [
    'rev-parse', '--path-format=absolute', '--git-path', 'index',
  ]), 'index-path-invalid');
  if (!path.isAbsolute(indexPath)) throw new InventoryError('index-path-invalid');
  return {
    headOid: runHermeticGitInventory(realRoot, ['rev-parse', '--verify', 'HEAD^{commit}']),
    headEntries: runHermeticGitInventory(realRoot, [
      'ls-tree', '-r', '-z', '--full-tree', '--format=%(objectmode) %(objecttype) %(objectname) %(path)', 'HEAD', '--',
    ]),
    indexEntries: runHermeticGitInventory(realRoot, [
      'ls-files', '-z', '--cached', '--full-name', '--format=%(objectmode) %(objectname) %(stage) %(path)', '--',
    ]),
    typeFlags: runHermeticGitInventory(realRoot, ['ls-files', '-z', '--cached', '--full-name', '-t', '--']),
    assumeFlags: runHermeticGitInventory(realRoot, ['ls-files', '-z', '--cached', '--full-name', '-v', '--']),
    debugFlags: runHermeticGitInventory(realRoot, ['ls-files', '-z', '--cached', '--full-name', '--debug', '--']),
    untracked: runHermeticGitInventory(realRoot, [
      '-c', `core.excludesFile=${os.devNull}`,
      'ls-files', '-z', '--others', '--exclude-per-directory=.gitignore', '--',
    ]),
    indexControl: readStableFileDigest(indexPath, 'index-control-invalid'),
  };
};

const rawInventoryStable = (before, after) => Object.keys(before).every((key) => {
  if (Buffer.isBuffer(before[key])) return Buffer.isBuffer(after[key]) && before[key].equals(after[key]);
  return JSON.stringify(before[key]) === JSON.stringify(after[key]);
});

const readStableWorktreeEntry = (realRoot, file, addIssue) => {
  const absolute = path.join(realRoot, ...file.split('/'));
  let pathStat;
  try {
    pathStat = fs.lstatSync(absolute, { bigint: true });
  } catch (error) {
    if (error.code === 'ENOENT') return { kind: 'absent' };
    addIssue('worktree-read-failed', file, 'worktree');
    return { kind: 'unsupported' };
  }
  if (pathStat.isSymbolicLink()) {
    addIssue('symlink', file, 'worktree');
    return { kind: 'unsupported' };
  }
  if (!pathStat.isFile()) {
    addIssue('special-file', file, 'worktree');
    return { kind: 'unsupported' };
  }
  if (pathStat.nlink !== 1n) {
    addIssue('hardlinked-file', file, 'worktree');
    return { kind: 'unsupported' };
  }
  try {
    if (fs.realpathSync(absolute) !== absolute) {
      addIssue('symlink-ancestor', file, 'worktree');
      return { kind: 'unsupported' };
    }
    const descriptor = fs.openSync(absolute, fs.constants.O_RDONLY | (fs.constants.O_NOFOLLOW ?? 0));
    try {
      const before = fs.fstatSync(descriptor, { bigint: true });
      if (!before.isFile() || !sameStableStat(pathStat, before)) throw new Error('unstable');
      const header = Buffer.from(`blob ${before.size.toString()}\0`, 'utf8');
      const rawDigest = createHash('sha256');
      const blobSha1 = createHash('sha1').update(header);
      const blobSha256 = createHash('sha256').update(header);
      const chunk = Buffer.allocUnsafe(64 * 1024);
      let total = 0n;
      for (;;) {
        const count = fs.readSync(descriptor, chunk, 0, chunk.length, null);
        if (count === 0) break;
        const bytes = chunk.subarray(0, count);
        rawDigest.update(bytes);
        blobSha1.update(bytes);
        blobSha256.update(bytes);
        total += BigInt(count);
      }
      const after = fs.fstatSync(descriptor, { bigint: true });
      const finalPathStat = fs.lstatSync(absolute, { bigint: true });
      if (!sameStableStat(before, after) || !sameStableStat(after, finalPathStat)
        || total !== after.size || fs.realpathSync(absolute) !== absolute) throw new Error('unstable');
      return {
        kind: 'file',
        mode: worktreeMode(after),
        rawSha256: rawDigest.digest('hex'),
        blobOids: { 40: blobSha1.digest('hex'), 64: blobSha256.digest('hex') },
        stat: stableStatRecord(after),
      };
    } finally {
      fs.closeSync(descriptor);
    }
  } catch {
    addIssue('unstable-or-unreadable-file', file, 'worktree');
    return { kind: 'unsupported' };
  }
};

const classifyGitEntry = (entry, source, addIssue) => {
  if (!entry) return false;
  if (entry.mode === '120000') addIssue('symlink', entry.path, source);
  else if (entry.mode === '160000') addIssue('gitlink', entry.path, source);
  else if (!NORMAL_MODES.has(entry.mode) || (source === 'head' && entry.type !== 'blob')) {
    addIssue('special-git-entry', entry.path, source);
  } else return true;
  return false;
};

const failedReport = code => ({
  schemaVersion: 1,
  reportType: 'ai-governance-validation-changed-set',
  ok: false,
  changedFileCount: 0,
  counts: { staged: 0, worktree: 0, untracked: 0, blocked: 1 },
  allFiles: [],
  issues: [{ code, path: null, source: 'inventory' }],
  stateSha256: null,
});

export const collectAuthoritativeValidationChangedSet = (rootDir) => {
  try {
    const realRoot = fs.realpathSync(rootDir);
    assertRepositoryRoot(realRoot);
    const inventory = captureRawInventory(realRoot);
    const headEntries = parseValidationHeadEntries(inventory.headEntries);
    const indexEntries = parseValidationIndexEntries(inventory.indexEntries);
    const typeFlags = parseTaggedPaths(inventory.typeFlags);
    const assumeFlags = parseTaggedPaths(inventory.assumeFlags);
    const debugFlags = parseIndexDebugFlags(inventory.debugFlags, indexEntries);
    const untracked = new Set(decodeRecords(inventory.untracked).map(requireSafePath));
    const head = mapUniqueEntries(headEntries);
    const index = groupIndexEntries(indexEntries);
    const indexPaths = new Set(index.keys());
    assertFlagInventory(indexPaths, typeFlags, assumeFlags);

    const issues = [];
    const issueKeys = new Set();
    const addIssue = (code, file, source) => {
      const key = `${source}\0${code}\0${file ?? ''}`;
      if (!issueKeys.has(key)) {
        issueKeys.add(key);
        issues.push({ code, path: file, source });
      }
    };
    const paths = new Set([...head.keys(), ...index.keys(), ...untracked]);

    index.forEach((entries, file) => {
      if (entries.length !== 1 || entries[0].stage !== 0) addIssue('unmerged-index', file, 'index');
      if (entries.some(entry => /^0+$/.test(entry.oid))
        || (debugFlags.get(file) & INTENT_TO_ADD_FLAG) !== 0n) addIssue('intent-to-add', file, 'index');
      if ([...(typeFlags.get(file) ?? [])].includes('S')) addIssue('skip-worktree', file, 'index');
      if ([...(assumeFlags.get(file) ?? [])].some(tag => /^[a-z]$/.test(tag))) {
        addIssue('assume-unchanged', file, 'index');
      }
    });

    const allFiles = [];
    const stateRecords = [];
    [...paths].sort().forEach((file) => {
      const changes = new Set();
      const headEntry = head.get(file);
      const indexGroup = index.get(file) ?? [];
      const indexEntry = indexGroup.length === 1 && indexGroup[0].stage === 0 ? indexGroup[0] : null;
      const headSupported = classifyGitEntry(headEntry, 'head', addIssue);
      const indexSupported = classifyGitEntry(indexEntry, 'index', addIssue)
        && !/^0+$/.test(indexEntry?.oid ?? '')
        && (debugFlags.get(file) & INTENT_TO_ADD_FLAG) === 0n;
      const worktree = readStableWorktreeEntry(realRoot, file, addIssue);

      if (!headEntry && indexSupported) changes.add('staged-added');
      else if (headSupported && !indexEntry) changes.add('staged-deleted');
      else if (headSupported && indexSupported) {
        if (headEntry.oid !== indexEntry.oid) changes.add('staged-content');
        if (headEntry.mode !== indexEntry.mode) changes.add('staged-mode');
      }

      if (indexSupported && worktree.kind === 'absent') changes.add('worktree-deleted');
      else if (indexSupported && worktree.kind === 'file') {
        if (worktree.blobOids[indexEntry.oid.length] !== indexEntry.oid) changes.add('worktree-content');
        if (worktree.mode !== indexEntry.mode) changes.add('worktree-mode');
      } else if (!indexEntry && worktree.kind !== 'absent' && (untracked.has(file) || headEntry)) {
        changes.add('untracked');
      }
      if (untracked.has(file) && indexEntry) addIssue('tracked-untracked-overlap', file, 'inventory');

      stateRecords.push({
        path: file,
        head: headEntry ? { mode: headEntry.mode, oid: headEntry.oid, type: headEntry.type } : null,
        index: indexGroup.map(entry => ({ mode: entry.mode, oid: entry.oid, stage: entry.stage })),
        typeTags: [...(typeFlags.get(file) ?? [])].sort(),
        assumeTags: [...(assumeFlags.get(file) ?? [])].sort(),
        debugFlags: debugFlags.has(file) ? debugFlags.get(file).toString(16) : null,
        untracked: untracked.has(file),
        worktree: worktree.kind === 'file' ? {
          kind: worktree.kind,
          mode: worktree.mode,
          rawSha256: worktree.rawSha256,
          stat: worktree.stat,
        } : { kind: worktree.kind },
      });

      const hasIssue = issues.some(issue => issue.path === file);
      if (changes.size > 0 || hasIssue) {
        allFiles.push({ path: file, changes: CHANGE_ORDER.filter(change => changes.has(change)) });
      }
    });
    issues.sort((left, right) => {
      const leftKey = `${left.source}\0${left.code}\0${left.path ?? ''}`;
      const rightKey = `${right.source}\0${right.code}\0${right.path ?? ''}`;
      return leftKey < rightKey ? -1 : Number(leftKey > rightKey);
    });
    const finalInventory = captureRawInventory(realRoot);
    if (!rawInventoryStable(inventory, finalInventory)) throw new InventoryError('inventory-drift');
    const headOid = decodeSingleLine(inventory.headOid, 'head-oid-invalid');
    if (!new RegExp(`^${OID_PATTERN}$`).test(headOid)) throw new InventoryError('head-oid-invalid');
    const stateSha256 = createHash('sha256').update(STATE_DIGEST_DOMAIN, 'utf8')
      .update(JSON.stringify({
        headOid,
        indexControl: inventory.indexControl,
        records: stateRecords,
        issues,
      }), 'utf8').digest('hex');
    const blockedPaths = new Set(issues.map(issue => issue.path ?? '<inventory>'));
    return {
      schemaVersion: 1,
      reportType: 'ai-governance-validation-changed-set',
      ok: issues.length === 0,
      changedFileCount: allFiles.length,
      counts: {
        staged: allFiles.filter(file => file.changes.some(change => change.startsWith('staged-'))).length,
        worktree: allFiles.filter(file => file.changes.some(change => change.startsWith('worktree-'))).length,
        untracked: allFiles.filter(file => file.changes.includes('untracked')).length,
        blocked: blockedPaths.size,
      },
      allFiles,
      issues,
      stateSha256,
    };
  } catch (error) {
    return failedReport(error instanceof InventoryError ? error.code : 'git-or-filesystem-inventory-failed');
  }
};
