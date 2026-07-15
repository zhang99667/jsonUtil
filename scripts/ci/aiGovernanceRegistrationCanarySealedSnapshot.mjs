import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

import {
  EVOLUTION_WORKTREE_REVISION_PROFILE,
  EVOLUTION_SEALED_WORKTREE_LIMITS,
  EVOLUTION_SEALED_WORKTREE_MANIFEST,
  EVOLUTION_WORKTREE_REVISION_EXCLUDED_PATHS,
  hashEvolutionSealedWorktreePayload,
  verifyEvolutionSealedWorktreeSnapshot,
} from './aiGovernanceEvolutionSealedWorktreeManifest.mjs';
import {
  assertRegistrationSnapshotInventoryBounds,
  collectRegistrationSnapshotGitInventory,
  visitRegistrationSnapshotSourceInventory,
} from './aiGovernanceRegistrationCanarySnapshotSource.mjs';

export { preflightRegistrationCanarySnapshot } from './aiGovernanceRegistrationCanarySnapshotPreflight.mjs';

export const REGISTRATION_CANARY_SEALED_SNAPSHOT = Object.freeze({
  id: 'mcp-registration-canary-sealed-snapshot',
  version: '2.0.0',
  caseId: 'mcp-registration-canary-sealed-snapshot-boundary',
});

const SHA256_PATTERN = /^[0-9a-f]{64}$/;
const isWithin = (parent, child) => {
  const relative = path.relative(parent, child);
  return relative === '' || (!path.isAbsolute(relative) && relative !== '..' && !relative.startsWith(`..${path.sep}`));
};

const readDirectoryIdentity = (target) => {
  const stat = fs.lstatSync(target, { bigint: true });
  if (!stat.isDirectory() || stat.isSymbolicLink()) throw new Error('sealed snapshot root identity 不是普通目录');
  return Object.freeze({ dev: String(stat.dev), ino: String(stat.ino) });
};
const sameIdentity = (left, right) => left?.dev === right?.dev && left?.ino === right?.ino;

const createOutputPaths = (sourceRoot, outputRoot) => {
  const requested = path.resolve(outputRoot);
  const parent = fs.realpathSync(path.dirname(requested));
  const output = path.join(parent, path.basename(requested));
  if (isWithin(sourceRoot, output)) throw new Error('sealed snapshot 输出必须位于 source checkout 外');
  try { fs.lstatSync(output); throw new Error('sealed snapshot 输出路径必须不存在'); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  const staging = path.join(parent, `.${path.basename(output)}.tmp-${randomUUID()}`);
  return { output, staging };
};

const writeSnapshotEntry = ({ staging, entry, directories }) => {
  if (entry.publicEntry.kind === 'file') {
    const target = path.join(staging, ...entry.publicEntry.path.split('/'));
    fs.mkdirSync(path.dirname(target), { recursive: true, mode: 0o700 });
    let current = path.dirname(target);
    while (isWithin(staging, current)) {
      directories.add(current);
      if (current === staging) break;
      current = path.dirname(current);
    }
    fs.writeFileSync(target, entry.bytes, { flag: 'wx', mode: 0o600 });
    fs.chmodSync(target, entry.publicEntry.sealedMode);
  }
};

const sealDirectories = directories => [...directories].sort((left, right) => right.length - left.length)
  .forEach(directory => fs.chmodSync(directory, 0o500));

const buildManifest = ({ inventory, publicEntries, environmentSha256, totalBytes, fixtureRevision }) => {
  const headAlgorithm = inventory.head.length === 40 ? 'sha1' : inventory.head.length === 64 ? 'sha256' : null;
  if (!headAlgorithm) throw new Error('sealed snapshot Git HEAD OID 非法');
  const manifest = {
    schemaVersion: 1,
    artifactType: 'jsonutils-evolution-sealed-worktree',
    manifestVersion: '2.0.0',
    dataClass: 'repository-source-unreviewed',
    source: {
      headOid: { algorithm: headAlgorithm, value: inventory.head },
      fixtureRevision,
      revisionProfile: EVOLUTION_WORKTREE_REVISION_PROFILE,
      inventoryProfile: 'git-index-plus-unignored-untracked-v1',
      excludedFromRevision: [...EVOLUTION_WORKTREE_REVISION_EXCLUDED_PATHS],
    },
    environmentBinding: { sha256: environmentSha256, status: 'caller-bound-unverified' },
    entries: publicEntries,
    bounds: {
      entryCount: publicEntries.length,
      fileCount: publicEntries.filter(entry => entry.kind === 'file').length,
      trackedEntries: publicEntries.filter(entry => entry.sourceClass === 'tracked').length,
      untrackedEntries: publicEntries.filter(entry => entry.sourceClass === 'untracked').length,
      totalBytes,
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

export const sealRegistrationCanarySnapshot = ({ sourceRoot, outputRoot, environmentSha256 }) => {
  if (!SHA256_PATTERN.test(environmentSha256 ?? '')) throw new TypeError('environmentSha256 必须是 64 位小写 SHA-256');
  const root = fs.realpathSync(sourceRoot);
  if (!fs.existsSync(path.join(root, '.git'))) throw new Error('sealed snapshot source 必须是 Git worktree 根目录');
  const { output, staging } = createOutputPaths(root, outputRoot);
  const inventory = collectRegistrationSnapshotGitInventory(root);
  assertRegistrationSnapshotInventoryBounds(root, inventory);
  let stagingIdentity = null;
  let renamed = false;
  try {
    fs.mkdirSync(staging, { mode: 0o700 });
    stagingIdentity = readDirectoryIdentity(staging);
    const directories = new Set([staging]);
    const sourceRead = visitRegistrationSnapshotSourceInventory({
      rootDir: root,
      inventory,
      onEntry: (entry) => {
        writeSnapshotEntry({ staging, entry, directories });
      },
    });
    const manifest = buildManifest({
      inventory,
      publicEntries: sourceRead.publicEntries,
      environmentSha256,
      totalBytes: sourceRead.totalBytes,
      fixtureRevision: sourceRead.fixtureRevision,
    });
    fs.writeFileSync(path.join(staging, EVOLUTION_SEALED_WORKTREE_MANIFEST), JSON.stringify(manifest), { flag: 'wx', mode: 0o400 });
    sealDirectories(directories);
    const inventoryAfter = collectRegistrationSnapshotGitInventory(root);
    assertRegistrationSnapshotInventoryBounds(root, inventoryAfter);
    const inventoryClasses = value => value.files.map(file => [file, value.sourceClasses.get(file)]);
    if (JSON.stringify(inventoryClasses(inventoryAfter)) !== JSON.stringify(inventoryClasses(inventory))
      || inventoryAfter.head !== inventory.head) throw new Error('sealed snapshot producer 期间 source/index/HEAD 发生变化');
    const sourceReread = visitRegistrationSnapshotSourceInventory({ rootDir: root, inventory: inventoryAfter });
    if (sourceReread.fixtureRevision !== sourceRead.fixtureRevision
      || JSON.stringify(sourceReread.publicEntries) !== JSON.stringify(sourceRead.publicEntries)) {
      throw new Error('sealed snapshot producer 期间 source 或 ledger 发生变化');
    }
    const stagedVerification = verifyEvolutionSealedWorktreeSnapshot(staging);
    fs.renameSync(staging, output);
    renamed = true;
    if (!sameIdentity(readDirectoryIdentity(output), stagingIdentity)) throw new Error('sealed snapshot rename 后 ownership identity 漂移');
    const verification = verifyEvolutionSealedWorktreeSnapshot(output);
    if (verification.snapshotSha256 !== stagedVerification.snapshotSha256) throw new Error('sealed snapshot rename 后摘要漂移');
    return verification;
  } catch (error) {
    if (stagingIdentity && Object.isExtensible(error)) {
      Object.defineProperty(error, 'retainedSnapshotPath', {
        value: renamed ? output : staging,
        enumerable: false,
      });
    }
    throw error;
  }
};
