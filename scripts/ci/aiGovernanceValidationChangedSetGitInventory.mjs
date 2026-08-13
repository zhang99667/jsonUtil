// 单源维护 Validation changed-set 的 Git 控制面与双遍稳定性。

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
import {
  sameJsonutilsValidationStat,
  stableJsonutilsValidationStat,
} from './aiGovernanceValidationRuntimePrimitives.mjs';

const OID_PATTERN = '(?:[0-9a-f]{40}|[0-9a-f]{64})';
const strictUtf8 = new TextDecoder('utf-8', { fatal: true });

export class ValidationChangedSetInventoryError extends Error {
  constructor(code) {
    super(code);
    this.code = code;
  }
}

const decodeRecords = (buffer) => {
  try {
    return decodeHermeticGitNulRecords(buffer);
  } catch {
    throw new ValidationChangedSetInventoryError('invalid-nul-or-utf8');
  }
};

const requireSafePath = (value) => {
  if (!isSafeHermeticGitPath(value)) throw new ValidationChangedSetInventoryError('unsafe-path');
  return value;
};

const parseEntries = (buffer, pattern, buildEntry) => decodeRecords(buffer).map((record) => {
  const match = record.match(pattern);
  if (!match) throw new ValidationChangedSetInventoryError('invalid-git-entry');
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
    if (!/^[A-Za-z?] /s.test(record)) throw new ValidationChangedSetInventoryError('invalid-index-flags');
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
      || buffer[offset + pathBytes.length] !== 0) {
      throw new ValidationChangedSetInventoryError('invalid-index-debug');
    }
    offset += pathBytes.length + 1;
    const metadataStart = offset;
    for (let line = 0; line < 5; line += 1) {
      const newline = buffer.indexOf(0x0a, offset);
      if (newline < 0) throw new ValidationChangedSetInventoryError('invalid-index-debug');
      offset = newline + 1;
    }
    const metadata = buffer.subarray(metadataStart, offset).toString('ascii');
    const match = metadata.match(/^  ctime: \d+:\d+\n  mtime: \d+:\d+\n  dev: \d+\tino: \d+\n  uid: \d+\tgid: \d+\n  size: \d+\tflags: ([0-9a-f]+)\n$/);
    if (!match) throw new ValidationChangedSetInventoryError('invalid-index-debug');
    byPath.set(entry.path, (byPath.get(entry.path) ?? 0n) | BigInt(`0x${match[1]}`));
  });
  if (offset !== buffer.length) throw new ValidationChangedSetInventoryError('invalid-index-debug');
  return byPath;
};

const mapUniqueEntries = (entries) => {
  const result = new Map();
  entries.forEach((entry) => {
    if (result.has(entry.path)) throw new ValidationChangedSetInventoryError('duplicate-head-path');
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
    if (flags.size !== indexPaths.size || [...indexPaths].some(file => !flags.has(file))) {
      throw new ValidationChangedSetInventoryError('index-flags-mismatch');
    }
  });
};

const decodeSingleLine = (buffer, code) => {
  let value;
  try {
    value = strictUtf8.decode(buffer);
  } catch {
    throw new ValidationChangedSetInventoryError(code);
  }
  if (!value.endsWith('\n') || value.slice(0, -1).includes('\n') || value.includes('\r') || value.includes('\0')) {
    throw new ValidationChangedSetInventoryError(code);
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
    throw new ValidationChangedSetInventoryError('repository-root-invalid');
  }
  if (canonicalRoot !== realRoot) throw new ValidationChangedSetInventoryError('repository-root-required');
};

const readStableFileDigest = (absolute, code) => {
  let descriptor;
  try {
    const pathStat = fs.lstatSync(absolute, { bigint: true });
    if (!pathStat.isFile() || pathStat.isSymbolicLink() || pathStat.nlink !== 1n
      || fs.realpathSync(absolute) !== absolute) throw new Error('unsafe');
    descriptor = fs.openSync(absolute, fs.constants.O_RDONLY | (fs.constants.O_NOFOLLOW ?? 0));
    const before = fs.fstatSync(descriptor, { bigint: true });
    if (!before.isFile() || !sameJsonutilsValidationStat(pathStat, before)) throw new Error('unstable');
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
    if (total !== after.size || !sameJsonutilsValidationStat(before, after)
      || !sameJsonutilsValidationStat(after, finalPathStat)
      || fs.realpathSync(absolute) !== absolute) throw new Error('unstable');
    return { sha256: digest.digest('hex'), stat: stableJsonutilsValidationStat(after) };
  } catch {
    throw new ValidationChangedSetInventoryError(code);
  } finally {
    if (descriptor !== undefined) fs.closeSync(descriptor);
  }
};

const captureRawInventory = (realRoot) => {
  const indexPath = decodeSingleLine(runHermeticGitInventory(realRoot, [
    'rev-parse', '--path-format=absolute', '--git-path', 'index',
  ]), 'index-path-invalid');
  if (!path.isAbsolute(indexPath)) throw new ValidationChangedSetInventoryError('index-path-invalid');
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

export const captureValidationChangedSetGitState = (realRoot) => {
  assertRepositoryRoot(realRoot);
  const rawInventory = captureRawInventory(realRoot);
  const indexEntries = parseValidationIndexEntries(rawInventory.indexEntries);
  const index = groupIndexEntries(indexEntries);
  const typeFlags = parseTaggedPaths(rawInventory.typeFlags);
  const assumeFlags = parseTaggedPaths(rawInventory.assumeFlags);
  assertFlagInventory(new Set(index.keys()), typeFlags, assumeFlags);
  const headOid = decodeSingleLine(rawInventory.headOid, 'head-oid-invalid');
  if (!new RegExp(`^${OID_PATTERN}$`).test(headOid)) {
    throw new ValidationChangedSetInventoryError('head-oid-invalid');
  }
  return {
    rawInventory,
    headOid,
    indexControl: rawInventory.indexControl,
    head: mapUniqueEntries(parseValidationHeadEntries(rawInventory.headEntries)),
    index,
    typeFlags,
    assumeFlags,
    debugFlags: parseIndexDebugFlags(rawInventory.debugFlags, indexEntries),
    untracked: new Set(decodeRecords(rawInventory.untracked).map(requireSafePath)),
  };
};

export const assertValidationChangedSetGitStateCurrent = (realRoot, state) => {
  if (!rawInventoryStable(state.rawInventory, captureRawInventory(realRoot))) {
    throw new ValidationChangedSetInventoryError('inventory-drift');
  }
};
