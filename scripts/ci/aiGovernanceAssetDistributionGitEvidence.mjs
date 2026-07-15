import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

import {
  decodeHermeticGitNulRecords,
  isSafeHermeticGitPath,
} from './aiGovernanceHermeticGitInventory.mjs';

const OID_PATTERN = '(?:[0-9a-f]{40}|[0-9a-f]{64})';
const sameFileStat = (left, right) => left.dev === right.dev && left.ino === right.ino
  && left.mode === right.mode && left.size === right.size
  && left.mtimeNs === right.mtimeNs && left.ctimeNs === right.ctimeNs;

const parseEntries = (buffer, pattern, buildEntry) => {
  const entries = new Map();
  for (const record of decodeHermeticGitNulRecords(buffer)) {
    const match = record.match(pattern);
    if (!match || !isSafeHermeticGitPath(match.at(-1)) || entries.has(match.at(-1))) {
      throw new Error('Git asset evidence record 非法或重复');
    }
    entries.set(match.at(-1), buildEntry(match));
  }
  return entries;
};

export const parseIndexAssetEntries = buffer => parseEntries(
  buffer,
  new RegExp(`^([0-7]{6}) (${OID_PATTERN}) ([0-3]) (.+)$`, 's'),
  match => ({ mode: match[1], oid: match[2], stage: Number(match[3]), type: 'blob' }),
);

export const parseHeadAssetEntries = buffer => parseEntries(
  buffer,
  new RegExp(`^([0-7]{6}) ([a-z]+) (${OID_PATTERN}) (.+)$`, 's'),
  match => ({ mode: match[1], type: match[2], oid: match[3], stage: 0 }),
);

export const readCurrentAssetEvidence = (rootDir, relativePath) => {
  if (!isSafeHermeticGitPath(relativePath)) throw new Error('AI asset path 非法');
  const realRoot = fs.realpathSync(rootDir);
  const absolutePath = path.join(realRoot, ...relativePath.split('/'));
  const before = fs.lstatSync(absolutePath, { bigint: true });
  if (!before.isFile() || before.isSymbolicLink() || fs.realpathSync(absolutePath) !== absolutePath) {
    throw new Error('AI asset 必须是仓库内普通文件且不能经过 symlink');
  }
  const bytes = fs.readFileSync(absolutePath);
  const after = fs.lstatSync(absolutePath, { bigint: true });
  if (!sameFileStat(before, after) || BigInt(bytes.length) !== after.size) {
    throw new Error('AI asset 读取期间发生变化');
  }
  return {
    bytes,
    mode: (after.mode & 0o111n) === 0n ? '100644' : '100755',
  };
};

const gitBlobOid = (bytes, oidLength) => {
  const algorithm = oidLength === 40 ? 'sha1' : oidLength === 64 ? 'sha256' : null;
  if (!algorithm) throw new Error('Git object id 长度非法');
  return createHash(algorithm)
    .update(Buffer.from(`blob ${bytes.length}\0`, 'utf8'))
    .update(bytes)
    .digest('hex');
};

export const matchesCurrentAssetEvidence = (entry, evidence) => Boolean(entry)
  && entry.stage === 0 && entry.type === 'blob'
  && (entry.mode === '100644' || entry.mode === '100755')
  && evidence.mode === entry.mode
  && gitBlobOid(evidence.bytes, entry.oid.length) === entry.oid;
