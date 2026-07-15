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

export {
  EVOLUTION_WORKTREE_REVISION_PROFILE,
  createEvolutionWorktreeRevisionHasher,
  hashEvolutionWorktreeEntries,
  readStableEvolutionSnapshotFile as readStableSnapshotFile,
};

export const EVOLUTION_SEALED_WORKTREE_MANIFEST = '.jsonutils-ai-snapshot.json';
export const EVOLUTION_WORKTREE_REVISION_EXCLUDED_PATHS = Object.freeze([
  'evals/ai-governance/outcomes.jsonl',
  'evals/ai-governance/trial-receipts.jsonl',
]);
export const EVOLUTION_SEALED_WORKTREE_LIMITS = Object.freeze({
  maxFiles: 5000,
  maxFileBytes: 16 * 1024 * 1024,
  maxTotalBytes: 64 * 1024 * 1024,
  maxManifestBytes: 4 * 1024 * 1024,
});

const SHA256_PATTERN = /^[0-9a-f]{64}$/;
const REVISION_PATTERN = /^worktree-[0-9a-f]{64}$/;
const ENTRY_FIELDS = ['path', 'kind', 'sourceClass', 'revisionIncluded', 'executableBits', 'byteLength', 'sha256', 'sealedMode'];
const CLAIM_FIELDS = [
  'evidenceScope', 'sourceIdentityVerified', 'immutableMountVerified', 'externalHostVerified',
  'environmentVerified', 'runtimeIsolationVerified', 'currentTaskRegistryVerified', 'outcomeEligible',
];
const CLAIMS = Object.freeze({
  evidenceScope: 'component-only',
  sourceIdentityVerified: false,
  immutableMountVerified: false,
  externalHostVerified: false,
  environmentVerified: false,
  runtimeIsolationVerified: false,
  currentTaskRegistryVerified: false,
  outcomeEligible: false,
});

const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const exactFields = (value, fields) => value && typeof value === 'object' && !Array.isArray(value)
  && Object.keys(value).length === fields.length && fields.every(field => Object.hasOwn(value, field));
const revisionIncludedFor = file => !EVOLUTION_WORKTREE_REVISION_EXCLUDED_PATHS.includes(file);

export const hashEvolutionSealedWorktreePayload = manifest => hash(JSON.stringify({
  domain: 'jsonutils.evolution.sealed-worktree-manifest/v1',
  value: { ...manifest, seal: { digestProfile: manifest.seal.digestProfile } },
}));

const readManifest = (snapshotRoot) => {
  const { bytes, stat } = readStableEvolutionSnapshotFile(
    snapshotRoot,
    EVOLUTION_SEALED_WORKTREE_MANIFEST,
    EVOLUTION_SEALED_WORKTREE_LIMITS.maxManifestBytes,
  );
  const text = bytes.toString('utf8');
  let manifest;
  try { manifest = JSON.parse(text); } catch { throw new Error('sealed snapshot manifest 不是合法 JSON'); }
  if (text !== JSON.stringify(manifest)) throw new Error('sealed snapshot manifest 必须使用精确紧凑 JSON');
  return { manifest, text, stat };
};

const validateManifestShape = (manifest) => {
  const rootFields = ['schemaVersion', 'artifactType', 'manifestVersion', 'dataClass', 'source', 'environmentBinding', 'entries', 'bounds', 'seal', 'claims'];
  if (!exactFields(manifest, rootFields)
    || !exactFields(manifest.source, ['headOid', 'fixtureRevision', 'revisionProfile', 'inventoryProfile', 'excludedFromRevision'])
    || !exactFields(manifest.source.headOid, ['algorithm', 'value'])
    || !exactFields(manifest.environmentBinding, ['sha256', 'status'])
    || !exactFields(manifest.bounds, ['entryCount', 'fileCount', 'trackedEntries', 'untrackedEntries', 'totalBytes', 'maxFiles', 'maxFileBytes', 'maxTotalBytes'])
    || !exactFields(manifest.seal, ['digestProfile', 'snapshotSha256'])
    || !exactFields(manifest.claims, CLAIM_FIELDS)) throw new Error('sealed snapshot manifest 必须是闭字段对象');
  const oid = manifest.source.headOid;
  const oidValid = oid.algorithm === 'sha1' ? /^[0-9a-f]{40}$/.test(oid.value)
    : oid.algorithm === 'sha256' && SHA256_PATTERN.test(oid.value);
  if (manifest.schemaVersion !== 1 || manifest.artifactType !== 'jsonutils-evolution-sealed-worktree'
    || manifest.manifestVersion !== '2.0.0' || manifest.dataClass !== 'repository-source-unreviewed'
    || !oidValid || !REVISION_PATTERN.test(manifest.source.fixtureRevision)
    || manifest.source.revisionProfile !== EVOLUTION_WORKTREE_REVISION_PROFILE
    || manifest.source.inventoryProfile !== 'git-index-plus-unignored-untracked-v1'
    || JSON.stringify(manifest.source.excludedFromRevision) !== JSON.stringify(EVOLUTION_WORKTREE_REVISION_EXCLUDED_PATHS)
    || !SHA256_PATTERN.test(manifest.environmentBinding.sha256)
    || manifest.environmentBinding.status !== 'caller-bound-unverified'
    || manifest.seal.digestProfile !== 'jsonutils-evolution-sealed-worktree/v1'
    || !SHA256_PATTERN.test(manifest.seal.snapshotSha256)
    || JSON.stringify(manifest.claims) !== JSON.stringify(CLAIMS)) throw new Error('sealed snapshot manifest 契约非法');
};

const validateEntries = (manifest) => {
  if (!Array.isArray(manifest.entries) || manifest.entries.length === 0
    || manifest.entries.length > EVOLUTION_SEALED_WORKTREE_LIMITS.maxFiles) throw new Error('sealed snapshot entries 数量非法');
  const paths = manifest.entries.map(entry => entry?.path);
  if (new Set(paths).size !== paths.length || paths.some((item, index) => index > 0 && paths[index - 1] >= item)
    || new Set(paths.map(item => item?.toLowerCase())).size !== paths.length) throw new Error('sealed snapshot entries 必须唯一、严格排序且无大小写冲突');
  manifest.entries.forEach((entry) => {
    if (!exactFields(entry, ENTRY_FIELDS) || !isSafeEvolutionSnapshotPath(entry.path) || entry.path === EVOLUTION_SEALED_WORKTREE_MANIFEST
      || !['file', 'deleted'].includes(entry.kind) || !['tracked', 'untracked'].includes(entry.sourceClass)
      || entry.revisionIncluded !== revisionIncludedFor(entry.path)
      || !Number.isInteger(entry.executableBits) || entry.executableBits < 0
      || (entry.executableBits & ~0o111) !== 0) {
      throw new Error(`sealed snapshot entry 非法: ${entry?.path ?? '<unknown>'}`);
    }
    if (entry.kind === 'deleted') {
      if (entry.sourceClass !== 'tracked' || entry.executableBits !== 0 || entry.byteLength !== null
        || entry.sha256 !== null || entry.sealedMode !== null) throw new Error(`sealed snapshot deleted entry 非法: ${entry.path}`);
    } else if (!Number.isSafeInteger(entry.byteLength) || entry.byteLength < 0
      || entry.byteLength > EVOLUTION_SEALED_WORKTREE_LIMITS.maxFileBytes || !SHA256_PATTERN.test(entry.sha256)
      || entry.sealedMode !== (0o400 | entry.executableBits)) {
      throw new Error(`sealed snapshot file entry 非法: ${entry.path}`);
    }
  });
};

const validateBounds = (manifest) => {
  const fileEntries = manifest.entries.filter(entry => entry.kind === 'file');
  const declaredTotalBytes = fileEntries.reduce((sum, entry) => sum + entry.byteLength, 0);
  const bounds = {
    entryCount: manifest.entries.length,
    fileCount: fileEntries.length,
    trackedEntries: manifest.entries.filter(entry => entry.sourceClass === 'tracked').length,
    untrackedEntries: manifest.entries.filter(entry => entry.sourceClass === 'untracked').length,
    totalBytes: declaredTotalBytes,
    maxFiles: EVOLUTION_SEALED_WORKTREE_LIMITS.maxFiles,
    maxFileBytes: EVOLUTION_SEALED_WORKTREE_LIMITS.maxFileBytes,
    maxTotalBytes: EVOLUTION_SEALED_WORKTREE_LIMITS.maxTotalBytes,
  };
  if (!Object.values(manifest.bounds).every(Number.isSafeInteger)
    || declaredTotalBytes > EVOLUTION_SEALED_WORKTREE_LIMITS.maxTotalBytes
    || JSON.stringify(bounds) !== JSON.stringify(manifest.bounds)) {
    throw new Error('sealed snapshot bounds 不匹配');
  }
  return declaredTotalBytes;
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
  const { manifest, text, stat: manifestStat } = readManifest(root);
  validateManifestShape(manifest);
  validateEntries(manifest);
  const declaredTotalBytes = validateBounds(manifest);
  if (evolutionSnapshotModeBits(manifestStat) !== 0o400) throw new Error('sealed snapshot manifest 必须为 0400');
  if (hashEvolutionSealedWorktreePayload(manifest) !== manifest.seal.snapshotSha256) throw new Error('sealed snapshot payload digest 不匹配');
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
    claims: CLAIMS,
  });
};

export const resolveEvolutionSealedWorktreeRevision = snapshotRoot => (
  verifyEvolutionSealedWorktreeSnapshot(snapshotRoot).fixtureRevision
);
