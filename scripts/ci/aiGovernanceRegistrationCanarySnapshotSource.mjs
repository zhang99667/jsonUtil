// 读取 hermetic Git inventory，并把 source 文件稳定投影成 registration snapshot entry。

import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

import {
  EVOLUTION_SEALED_WORKTREE_LIMITS,
  EVOLUTION_SEALED_WORKTREE_MANIFEST,
  EVOLUTION_WORKTREE_REVISION_EXCLUDED_PATHS,
  createEvolutionWorktreeRevisionHasher,
} from './aiGovernanceEvolutionSealedWorktreeManifest.mjs';
import {
  decodeHermeticGitPathList,
  runHermeticGitInventory,
} from './aiGovernanceHermeticGitInventory.mjs';
import { readExactBoundedDescriptor } from './aiGovernanceEvolutionSnapshotPrimitives.mjs';

const PRIVATE_KEY_MARKERS = ['', 'ENCRYPTED ', 'RSA ', 'EC ', 'OPENSSH ', 'DSA ']
  .map(type => Buffer.from(['-----BEGIN ', type, 'PRIVATE KEY-----'].join(''), 'ascii'));
const ENV_EXAMPLE_PATTERN = /^\.env\.(?:example|sample|template)$/i;
const RISKY_EXTENSIONS = new Set(['.pem', '.key', '.p12', '.pfx', '.jks']);
const RISKY_BASENAMES = new Set(['id_rsa', 'id_ed25519', 'id_dsa', '.netrc', '.pypirc', 'credentials.json', 'service-account.json']);
const sha256 = value => createHash('sha256').update(value).digest('hex');
const gitPathList = (rootDir, args) => decodeHermeticGitPathList(runHermeticGitInventory(rootDir, args));

export const collectRegistrationSnapshotGitInventory = (rootDir) => {
  const head = runHermeticGitInventory(rootDir, ['rev-parse', 'HEAD']).toString('ascii').trim();
  if (!/^(?:[0-9a-f]{40}|[0-9a-f]{64})$/.test(head)) throw new Error('sealed snapshot Git HEAD OID 非法');
  const tracked = gitPathList(rootDir, ['ls-files', '-z', '--cached']);
  const untracked = gitPathList(rootDir, ['ls-files', '-z', '--others', '--exclude-standard']);
  const sourceClasses = new Map([...tracked.map(file => [file, 'tracked']), ...untracked.map(file => [file, 'untracked'])]);
  const files = [...sourceClasses.keys()].sort();
  if (files.length === 0 || files.length > EVOLUTION_SEALED_WORKTREE_LIMITS.maxFiles
    || files.includes(EVOLUTION_SEALED_WORKTREE_MANIFEST)) throw new Error('sealed snapshot Git inventory 数量或保留路径非法');
  return { head, files, sourceClasses };
};

export const assertRegistrationSnapshotInventoryBounds = (rootDir, inventory) => {
  let totalBytes = 0n;
  inventory.files.forEach((file) => {
    let stat;
    try { stat = fs.lstatSync(path.join(rootDir, ...file.split('/')), { bigint: true }); }
    catch (error) {
      if (error.code === 'ENOENT' && inventory.sourceClasses.get(file) === 'tracked') return;
      throw error;
    }
    if (!stat.isFile() || stat.isSymbolicLink()) throw new Error(`sealed snapshot 只接受普通文件: ${file}`);
    if (stat.size > BigInt(EVOLUTION_SEALED_WORKTREE_LIMITS.maxFileBytes)) throw new Error(`sealed snapshot 文件超限: ${file}`);
    totalBytes += stat.size;
    if (totalBytes > BigInt(EVOLUTION_SEALED_WORKTREE_LIMITS.maxTotalBytes)) throw new Error('sealed snapshot 总字节数超限');
  });
  return Number(totalBytes);
};

const sameStableStat = (left, right) => left.dev === right.dev && left.ino === right.ino
  && left.mode === right.mode && left.size === right.size && left.nlink === right.nlink
  && left.uid === right.uid && left.gid === right.gid
  && left.mtimeNs === right.mtimeNs && left.ctimeNs === right.ctimeNs;

const collectSensitiveFileFailures = (relativePath, sourceClass, bytes) => {
  const lowerPath = relativePath.toLowerCase();
  const basename = path.posix.basename(lowerPath);
  const extension = path.posix.extname(basename);
  const failures = [];
  if ((basename === '.env' || basename.startsWith('.env.')) && !ENV_EXAMPLE_PATTERN.test(basename)) failures.push('真实 .env 文件');
  if (RISKY_EXTENSIONS.has(extension) || RISKY_BASENAMES.has(basename)
    || lowerPath.split('/').some(part => ['.ssh', '.aws', '.gnupg'].includes(part))) failures.push('密钥或 credential 路径');
  if (sourceClass === 'untracked' && ['outputs/', 'artifacts/', 'tmp/'].some(prefix => lowerPath.startsWith(prefix))) {
    failures.push('未跟踪用户产物路径');
  }
  const text = (ENV_EXAMPLE_PATTERN.test(basename) || basename === '.npmrc' || bytes.length <= 1024 * 1024)
    ? bytes.toString('utf8') : '';
  if (PRIVATE_KEY_MARKERS.some(marker => bytes.includes(marker))) failures.push('私钥正文');
  if (ENV_EXAMPLE_PATTERN.test(basename)) {
    const unsafeAssignment = text.split(/\r?\n/).some((line) => {
      const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
      return match && /(key|token|secret|password|credential)/i.test(match[1]) && match[2].length > 0;
    });
    if (unsafeAssignment) failures.push('示例 env 含非空敏感值');
  }
  if (basename === '.npmrc' && /^\s*(?:_auth|_authToken|.*:_authToken|password)\s*=\s*\S+/im.test(text)) {
    failures.push('.npmrc 含认证值');
  }
  return failures;
};

export const readStableRegistrationSnapshotSourceEntry = (rootDir, relativePath, sourceClass) => {
  const absolutePath = path.join(rootDir, ...relativePath.split('/'));
  let pathStat;
  try { pathStat = fs.lstatSync(absolutePath, { bigint: true }); }
  catch (error) {
    if (error.code === 'ENOENT' && sourceClass === 'tracked') {
      return {
        publicEntry: {
          path: relativePath,
          kind: 'deleted',
          sourceClass,
          revisionIncluded: !EVOLUTION_WORKTREE_REVISION_EXCLUDED_PATHS.includes(relativePath),
          executableBits: 0,
          byteLength: null,
          sha256: null,
          sealedMode: null,
        },
      };
    }
    throw error;
  }
  const resolvedPath = fs.realpathSync(absolutePath);
  if (resolvedPath !== absolutePath || pathStat.isSymbolicLink() || !pathStat.isFile()) {
    throw new Error(`sealed snapshot 只接受无 symlink 祖先的普通文件: ${relativePath}`);
  }
  if (pathStat.size > BigInt(EVOLUTION_SEALED_WORKTREE_LIMITS.maxFileBytes)) throw new Error(`sealed snapshot 文件超限: ${relativePath}`);
  const descriptor = fs.openSync(absolutePath, fs.constants.O_RDONLY | (fs.constants.O_NOFOLLOW ?? 0));
  try {
    const before = fs.fstatSync(descriptor, { bigint: true });
    if (!before.isFile() || !sameStableStat(pathStat, before)) {
      throw new Error(`sealed snapshot 文件打开期间被替换: ${relativePath}`);
    }
    const bytes = readExactBoundedDescriptor(descriptor, Number(before.size), `sealed snapshot source ${relativePath}`);
    const after = fs.fstatSync(descriptor, { bigint: true });
    const finalPathStat = fs.lstatSync(absolutePath, { bigint: true });
    if (!sameStableStat(before, after) || !sameStableStat(after, finalPathStat)
      || fs.realpathSync(absolutePath) !== absolutePath) {
      throw new Error(`sealed snapshot 文件读取期间发生变化: ${relativePath}`);
    }
    const sensitiveFailures = collectSensitiveFileFailures(relativePath, sourceClass, bytes);
    if (sensitiveFailures.length > 0) throw new Error(`sealed snapshot 拒绝 ${relativePath}: ${sensitiveFailures.join('、')}`);
    const executableBits = Number(before.mode & 0o111n);
    return {
      bytes,
      publicEntry: {
        path: relativePath,
        kind: 'file',
        sourceClass,
        revisionIncluded: !EVOLUTION_WORKTREE_REVISION_EXCLUDED_PATHS.includes(relativePath),
        executableBits,
        byteLength: bytes.length,
        sha256: sha256(bytes),
        sealedMode: 0o400 | executableBits,
      },
    };
  } finally { fs.closeSync(descriptor); }
};

export const visitRegistrationSnapshotSourceInventory = ({ rootDir, inventory, onEntry = () => {} }) => {
  const revisionHasher = createEvolutionWorktreeRevisionHasher();
  const publicEntries = [];
  let totalBytes = 0;
  inventory.files.forEach((file) => {
    const entry = readStableRegistrationSnapshotSourceEntry(rootDir, file, inventory.sourceClasses.get(file));
    if (entry.publicEntry.kind === 'file') {
      totalBytes += entry.publicEntry.byteLength;
      if (totalBytes > EVOLUTION_SEALED_WORKTREE_LIMITS.maxTotalBytes) throw new Error('sealed snapshot 总字节数超限');
    }
    revisionHasher.add({ ...entry.publicEntry, ...(entry.bytes ? { bytes: entry.bytes } : {}) });
    onEntry(entry);
    publicEntries.push(entry.publicEntry);
  });
  return Object.freeze({
    publicEntries: Object.freeze(publicEntries),
    totalBytes,
    fixtureRevision: revisionHasher.digest(),
  });
};
