// 统一维护 evolution worktree revision 字节语义与 sealed snapshot 稳定读取原语。

import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const updateField = (digest, label, value) => {
  const bytes = Buffer.isBuffer(value) ? value : Buffer.from(String(value), 'utf8');
  digest.update(`${label}:${bytes.length}\0`, 'utf8');
  digest.update(bytes);
  digest.update('\0', 'utf8');
};

export const EVOLUTION_WORKTREE_REVISION_PROFILE = 'jsonutils-evolution-source-state-v2';

export const isSafeEvolutionSnapshotPath = value => typeof value === 'string' && value.length > 0
  && !path.posix.isAbsolute(value) && !value.includes('\\') && !value.includes('\0')
  && value.normalize('NFC') === value && path.posix.normalize(value) === value
  && value !== '.' && value !== '..' && !value.startsWith('../');

export const createEvolutionWorktreeRevisionHasher = () => {
  const digest = createHash('sha256');
  updateField(digest, 'profile', EVOLUTION_WORKTREE_REVISION_PROFILE);
  let lastPath = null;
  let result = null;
  return Object.freeze({
    add(entry) {
      if (result !== null) throw new Error('worktree revision hasher 已结束');
      if (entry.revisionIncluded === false) return;
      if (typeof entry.path !== 'string' || (lastPath !== null && lastPath >= entry.path)) {
        throw new Error('worktree revision entries 必须按 path 严格递增');
      }
      lastPath = entry.path;
      updateField(digest, 'path', entry.path);
      if (entry.kind === 'deleted') updateField(digest, 'deleted', 'true');
      else {
        updateField(digest, 'mode', entry.executableBits);
        if (entry.kind === 'file') updateField(digest, 'file', entry.bytes);
        else if (entry.kind === 'symlink') updateField(digest, 'symlink', entry.target);
        else updateField(digest, 'unsupported', entry.unsupported);
      }
    },
    digest() {
      if (result === null) result = `worktree-${digest.digest('hex')}`;
      return result;
    },
  });
};

export const hashEvolutionWorktreeEntries = ({ entries }) => {
  const hasher = createEvolutionWorktreeRevisionHasher();
  [...entries].sort((left, right) => (
    left.path < right.path ? -1 : left.path > right.path ? 1 : 0
  )).forEach(entry => hasher.add(entry));
  return hasher.digest();
};

export const sameEvolutionSnapshotStat = (left, right) => left.dev === right.dev && left.ino === right.ino
  && left.mode === right.mode && left.size === right.size && left.nlink === right.nlink
  && left.uid === right.uid && left.gid === right.gid
  && left.mtimeNs === right.mtimeNs && left.ctimeNs === right.ctimeNs;

export const evolutionSnapshotModeBits = stat => Number(stat.mode & 0o777n);

export const readExactBoundedDescriptor = (descriptor, size, label) => {
  if (!Number.isSafeInteger(size) || size < 0) throw new Error(`${label} 大小非法`);
  const bytes = Buffer.alloc(size);
  let offset = 0;
  while (offset < size) {
    const count = fs.readSync(descriptor, bytes, offset, size - offset, offset);
    if (count === 0) throw new Error(`${label} 读取期间缩短`);
    offset += count;
  }
  const extra = Buffer.alloc(1);
  if (fs.readSync(descriptor, extra, 0, 1, size) !== 0) throw new Error(`${label} 读取期间增长`);
  return bytes;
};

const isWithin = (parent, child) => {
  const relative = path.relative(parent, child);
  return relative === '' || (!path.isAbsolute(relative) && relative !== '..' && !relative.startsWith(`..${path.sep}`));
};

export const readStableEvolutionSnapshotFile = (snapshotRoot, relativePath, maxBytes, expectedStat = null) => {
  if (!isSafeEvolutionSnapshotPath(relativePath) || !Number.isSafeInteger(maxBytes) || maxBytes < 0) {
    throw new TypeError('sealed snapshot 稳定读取参数非法');
  }
  const absolutePath = path.join(snapshotRoot, ...relativePath.split('/'));
  const pathStat = fs.lstatSync(absolutePath, { bigint: true });
  if (!pathStat.isFile() || pathStat.isSymbolicLink() || pathStat.nlink !== 1n || pathStat.size > BigInt(maxBytes)
    || (expectedStat && !sameEvolutionSnapshotStat(pathStat, expectedStat))) {
    throw new Error(`sealed snapshot 必须是稳定有界普通文件: ${relativePath}`);
  }
  const resolvedPath = fs.realpathSync(absolutePath);
  if (resolvedPath !== absolutePath || !isWithin(snapshotRoot, resolvedPath)) {
    throw new Error(`sealed snapshot 禁止 symlink 祖先: ${relativePath}`);
  }
  const descriptor = fs.openSync(absolutePath, fs.constants.O_RDONLY | (fs.constants.O_NOFOLLOW ?? 0));
  try {
    const before = fs.fstatSync(descriptor, { bigint: true });
    if (!before.isFile() || !sameEvolutionSnapshotStat(pathStat, before)) {
      throw new Error(`sealed snapshot 文件打开期间被替换: ${relativePath}`);
    }
    const bytes = readExactBoundedDescriptor(descriptor, Number(before.size), `sealed snapshot ${relativePath}`);
    const after = fs.fstatSync(descriptor, { bigint: true });
    const finalPathStat = fs.lstatSync(absolutePath, { bigint: true });
    if (!sameEvolutionSnapshotStat(before, after) || !sameEvolutionSnapshotStat(after, finalPathStat)
      || fs.realpathSync(absolutePath) !== absolutePath) {
      throw new Error(`sealed snapshot 文件读取期间发生变化: ${relativePath}`);
    }
    return { bytes, stat: after };
  } finally { fs.closeSync(descriptor); }
};
