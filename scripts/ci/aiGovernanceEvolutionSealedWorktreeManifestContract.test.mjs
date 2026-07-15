import assert from 'node:assert/strict';
import { test } from 'node:test';

import { hashEvolutionSealedWorktreePayload as legacyHashEvolutionSealedWorktreePayload } from './aiGovernanceEvolutionSealedWorktreeManifest.mjs';
import {
  EVOLUTION_SEALED_WORKTREE_LIMITS,
  EVOLUTION_WORKTREE_REVISION_PROFILE,
  hashEvolutionSealedWorktreePayload,
  parseEvolutionSealedWorktreeManifest,
} from './aiGovernanceEvolutionSealedWorktreeManifestContract.mjs';

const createManifest = () => {
  const manifest = {
    schemaVersion: 1,
    artifactType: 'jsonutils-evolution-sealed-worktree',
    manifestVersion: '2.0.0',
    dataClass: 'repository-source-unreviewed',
    source: {
      headOid: { algorithm: 'sha1', value: 'a'.repeat(40) },
      fixtureRevision: `worktree-${'b'.repeat(64)}`,
      revisionProfile: EVOLUTION_WORKTREE_REVISION_PROFILE,
      inventoryProfile: 'git-index-plus-unignored-untracked-v1',
      excludedFromRevision: [
        'evals/ai-governance/outcomes.jsonl',
        'evals/ai-governance/trial-receipts.jsonl',
      ],
    },
    environmentBinding: { sha256: 'c'.repeat(64), status: 'caller-bound-unverified' },
    entries: [{
      path: 'fixture.txt', kind: 'file', sourceClass: 'tracked', revisionIncluded: true,
      executableBits: 0, byteLength: 7, sha256: 'd'.repeat(64), sealedMode: 0o400,
    }],
    bounds: {
      entryCount: 1, fileCount: 1, trackedEntries: 1, untrackedEntries: 0, totalBytes: 7,
      maxFiles: EVOLUTION_SEALED_WORKTREE_LIMITS.maxFiles,
      maxFileBytes: EVOLUTION_SEALED_WORKTREE_LIMITS.maxFileBytes,
      maxTotalBytes: EVOLUTION_SEALED_WORKTREE_LIMITS.maxTotalBytes,
    },
    seal: { digestProfile: 'jsonutils-evolution-sealed-worktree/v1', snapshotSha256: '' },
    claims: {
      evidenceScope: 'component-only', sourceIdentityVerified: false, immutableMountVerified: false,
      externalHostVerified: false, environmentVerified: false, runtimeIsolationVerified: false,
      currentTaskRegistryVerified: false, outcomeEligible: false,
    },
  };
  manifest.seal.snapshotSha256 = hashEvolutionSealedWorktreePayload(manifest);
  return manifest;
};

test('sealed worktree manifest contract 解析闭字段紧凑文本并保留旧 hash 导出引用', () => {
  const manifest = createManifest();
  const parsed = parseEvolutionSealedWorktreeManifest(JSON.stringify(manifest));
  assert.deepEqual(parsed.manifest, manifest);
  assert.equal(parsed.declaredTotalBytes, 7);
  assert.equal(legacyHashEvolutionSealedWorktreePayload, hashEvolutionSealedWorktreePayload);
});

test('sealed worktree manifest contract 拒绝非紧凑、额外字段、entry、bounds 与 payload 漂移', () => {
  assert.throws(() => parseEvolutionSealedWorktreeManifest(JSON.stringify(createManifest(), null, 2)), /精确紧凑 JSON/);

  const extraField = createManifest();
  extraField.extra = true;
  assert.throws(() => parseEvolutionSealedWorktreeManifest(JSON.stringify(extraField)), /闭字段对象/);

  const invalidEntry = createManifest();
  invalidEntry.entries[0].revisionIncluded = false;
  assert.throws(() => parseEvolutionSealedWorktreeManifest(JSON.stringify(invalidEntry)), /entry 非法/);

  const invalidBounds = createManifest();
  invalidBounds.bounds.totalBytes = 8;
  assert.throws(() => parseEvolutionSealedWorktreeManifest(JSON.stringify(invalidBounds)), /bounds 不匹配/);

  const invalidPayload = createManifest();
  invalidPayload.environmentBinding.sha256 = 'e'.repeat(64);
  assert.throws(() => parseEvolutionSealedWorktreeManifest(JSON.stringify(invalidPayload)), /payload digest 不匹配/);
});
