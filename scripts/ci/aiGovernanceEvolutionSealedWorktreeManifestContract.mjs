// 单向维护 sealed worktree manifest 的文本、闭字段、entry、bounds 与 payload 契约。

import { createHash } from 'node:crypto';

import {
  EVOLUTION_WORKTREE_REVISION_PROFILE,
  isSafeEvolutionSnapshotPath,
} from './aiGovernanceEvolutionSnapshotPrimitives.mjs';

export { EVOLUTION_WORKTREE_REVISION_PROFILE };

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
export const EVOLUTION_SEALED_WORKTREE_CLAIMS = Object.freeze({
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
    || JSON.stringify(manifest.claims) !== JSON.stringify(EVOLUTION_SEALED_WORKTREE_CLAIMS)) {
    throw new Error('sealed snapshot manifest 契约非法');
  }
};

const validateEntries = (manifest) => {
  if (!Array.isArray(manifest.entries) || manifest.entries.length === 0
    || manifest.entries.length > EVOLUTION_SEALED_WORKTREE_LIMITS.maxFiles) throw new Error('sealed snapshot entries 数量非法');
  const paths = manifest.entries.map(entry => entry?.path);
  if (new Set(paths).size !== paths.length || paths.some((item, index) => index > 0 && paths[index - 1] >= item)
    || new Set(paths.map(item => item?.toLowerCase())).size !== paths.length) {
    throw new Error('sealed snapshot entries 必须唯一、严格排序且无大小写冲突');
  }
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
    || JSON.stringify(bounds) !== JSON.stringify(manifest.bounds)) throw new Error('sealed snapshot bounds 不匹配');
  return declaredTotalBytes;
};

export const parseEvolutionSealedWorktreeManifest = (text) => {
  let manifest;
  try { manifest = JSON.parse(text); } catch { throw new Error('sealed snapshot manifest 不是合法 JSON'); }
  if (text !== JSON.stringify(manifest)) throw new Error('sealed snapshot manifest 必须使用精确紧凑 JSON');
  validateManifestShape(manifest);
  validateEntries(manifest);
  const declaredTotalBytes = validateBounds(manifest);
  if (hashEvolutionSealedWorktreePayload(manifest) !== manifest.seal.snapshotSha256) {
    throw new Error('sealed snapshot payload digest 不匹配');
  }
  return Object.freeze({ manifest, declaredTotalBytes });
};
