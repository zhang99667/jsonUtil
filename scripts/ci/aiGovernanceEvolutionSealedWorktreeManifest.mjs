import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

import {
  EVOLUTION_WORKTREE_REVISION_PROFILE,
  createEvolutionWorktreeRevisionHasher,
  evolutionSnapshotModeBits,
  hashEvolutionWorktreeEntries,
  isSafeEvolutionSnapshotPath,
  readStableEvolutionSnapshotFile,
  sameEvolutionSnapshotStat,
} from './aiGovernanceEvolutionSnapshotPrimitives.mjs';
import {
  EVOLUTION_SEALED_WORKTREE_CLAIMS,
  EVOLUTION_SEALED_WORKTREE_LIMITS,
  EVOLUTION_SEALED_WORKTREE_MANIFEST,
  EVOLUTION_WORKTREE_REVISION_EXCLUDED_PATHS,
  hashEvolutionSealedWorktreePayload,
  parseEvolutionSealedWorktreeManifest,
} from './aiGovernanceEvolutionSealedWorktreeManifestContract.mjs';

export {
  EVOLUTION_SEALED_WORKTREE_LIMITS,
  EVOLUTION_SEALED_WORKTREE_MANIFEST,
  EVOLUTION_WORKTREE_REVISION_PROFILE,
  EVOLUTION_WORKTREE_REVISION_EXCLUDED_PATHS,
  createEvolutionWorktreeRevisionHasher,
  hashEvolutionSealedWorktreePayload,
  hashEvolutionWorktreeEntries,
  readStableEvolutionSnapshotFile as readStableSnapshotFile,
};

const hash = bytes => createHash('sha256').update(bytes).digest('hex');

const readManifest = (snapshotRoot) => {
  const { bytes, stat } = readStableEvolutionSnapshotFile(
    snapshotRoot,
    EVOLUTION_SEALED_WORKTREE_MANIFEST,
    EVOLUTION_SEALED_WORKTREE_LIMITS.maxManifestBytes,
  );
  const text = bytes.toString('utf8');
  const parsed = parseEvolutionSealedWorktreeManifest(text);
  return { ...parsed, text, stat };
};

const enumerateSnapshot = (root) => {
  const files = new Map();
  const directories = new Set(['']);
  const visit = (relativeDir) => {
    const absoluteDir = path.join(root, relativeDir);
    const directoryStat = fs.lstatSync(absoluteDir, { bigint: true });
    if (!directoryStat.isDirectory() || directoryStat.isSymbolicLink() || evolutionSnapshotModeBits(directoryStat) !== 0o500) {
      throw new Error(`sealed snapshot 目录不是 0500 普通目录: ${relativeDir || '.'}`);
    }
    fs.readdirSync(absoluteDir).sort().forEach((name) => {
      const relative = relativeDir ? `${relativeDir}/${name}` : name;
      const absolute = path.join(root, ...relative.split('/'));
      const stat = fs.lstatSync(absolute, { bigint: true });
      if (stat.isSymbolicLink()) throw new Error(`sealed snapshot 禁止 symlink: ${relative}`);
      if (stat.isDirectory()) { directories.add(relative); visit(relative); }
      else if (stat.isFile()) files.set(relative, stat);
      else throw new Error(`sealed snapshot 禁止特殊文件: ${relative}`);
    });
  };
  visit('');
  return { files, directories };
};

const expectedDirectories = entries => new Set(['', ...entries.filter(entry => entry.kind === 'file').flatMap((entry) => {
  const parts = entry.path.split('/').slice(0, -1);
  return parts.map((_, index) => parts.slice(0, index + 1).join('/'));
})]);

export const verifyEvolutionSealedWorktreeSnapshot = (snapshotRoot) => {
  const root = fs.realpathSync(snapshotRoot);
  if (fs.existsSync(path.join(root, '.git'))) throw new Error('sealed snapshot 禁止包含 Git metadata');
  const { manifest, text, stat: manifestStat, declaredTotalBytes } = readManifest(root);
  if (evolutionSnapshotModeBits(manifestStat) !== 0o400) throw new Error('sealed snapshot manifest 必须为 0400');
  const { files, directories } = enumerateSnapshot(root);
  if (!files.has(EVOLUTION_SEALED_WORKTREE_MANIFEST)
    || !sameEvolutionSnapshotStat(files.get(EVOLUTION_SEALED_WORKTREE_MANIFEST), manifestStat)) {
    throw new Error('sealed snapshot manifest 在枚举期间发生变化');
  }
  const expectedFiles = manifest.entries.filter(entry => entry.kind === 'file').map(entry => entry.path);
  const actualFiles = [...files.keys()].filter(file => file !== EVOLUTION_SEALED_WORKTREE_MANIFEST).sort();
  if (JSON.stringify(actualFiles) !== JSON.stringify(expectedFiles)
    || JSON.stringify([...directories].sort()) !== JSON.stringify([...expectedDirectories(manifest.entries)].sort())) {
    throw new Error('sealed snapshot 目录与 manifest exact set 不一致');
  }
  const revisionHasher = createEvolutionWorktreeRevisionHasher();
  let totalBytes = 0;
  manifest.entries.forEach((entry) => {
    if (entry.kind === 'deleted') {
      if (files.has(entry.path) || fs.existsSync(path.join(root, ...entry.path.split('/')))) throw new Error(`deleted entry 被物化: ${entry.path}`);
      revisionHasher.add(entry);
      return;
    }
    const enumeratedStat = files.get(entry.path);
    const enumeratedSize = Number(enumeratedStat.size);
    if (!Number.isSafeInteger(enumeratedSize) || totalBytes + enumeratedSize > EVOLUTION_SEALED_WORKTREE_LIMITS.maxTotalBytes) {
      throw new Error('sealed snapshot 总字节数超限');
    }
    const { bytes, stat } = readStableEvolutionSnapshotFile(
      root,
      entry.path,
      EVOLUTION_SEALED_WORKTREE_LIMITS.maxFileBytes,
      enumeratedStat,
    );
    const actualExecutableBits = Number(stat.mode & 0o111n);
    if (evolutionSnapshotModeBits(stat) !== entry.sealedMode || actualExecutableBits !== entry.executableBits
      || Number(stat.size) !== entry.byteLength || hash(bytes) !== entry.sha256) {
      throw new Error(`sealed snapshot 文件摘要、大小或 mode 漂移: ${entry.path}`);
    }
    totalBytes += bytes.length;
    revisionHasher.add({ ...entry, executableBits: actualExecutableBits, bytes });
  });
  const fileEntries = manifest.entries.filter(entry => entry.kind === 'file');
  const bounds = {
    entryCount: manifest.entries.length,
    fileCount: fileEntries.length,
    trackedEntries: manifest.entries.filter(entry => entry.sourceClass === 'tracked').length,
    untrackedEntries: manifest.entries.filter(entry => entry.sourceClass === 'untracked').length,
    totalBytes,
    maxFiles: EVOLUTION_SEALED_WORKTREE_LIMITS.maxFiles,
    maxFileBytes: EVOLUTION_SEALED_WORKTREE_LIMITS.maxFileBytes,
    maxTotalBytes: EVOLUTION_SEALED_WORKTREE_LIMITS.maxTotalBytes,
  };
  if (JSON.stringify(bounds) !== JSON.stringify(manifest.bounds) || totalBytes !== declaredTotalBytes) {
    throw new Error('sealed snapshot bounds 不匹配');
  }
  const fixtureRevision = revisionHasher.digest();
  if (fixtureRevision !== manifest.source.fixtureRevision) throw new Error('sealed snapshot 无法重建 fixture revision');
  return Object.freeze({
    manifest,
    manifestFileSha256: hash(text),
    snapshotSha256: manifest.seal.snapshotSha256,
    fixtureRevision,
    environmentSha256: manifest.environmentBinding.sha256,
    observations: Object.freeze({
      fileInventoryVerified: true,
      readOnlyModeObserved: true,
      revisionReproduced: true,
      ledgerGitPrefixVerified: false,
    }),
    claims: EVOLUTION_SEALED_WORKTREE_CLAIMS,
  });
};

export const resolveEvolutionSealedWorktreeRevision = snapshotRoot => (
  verifyEvolutionSealedWorktreeSnapshot(snapshotRoot).fixtureRevision
);
