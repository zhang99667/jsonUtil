import { createHash, randomBytes } from 'node:crypto';
import { execFile, spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const SEATBELT_SENTINEL_CONTRACT = Object.freeze({
  id: 'codex-external-controller-seatbelt-sentinel-execution',
  version: '2.2.0',
  evidenceScope: 'component-only',
  coverage: 'macos-seatbelt-policy-subset',
  producer: 'project-plugin-installed-copy-unverified',
});

export const SEALED_SNAPSHOT_MANIFEST = '.jsonutils-ai-snapshot.json';
export const SEALED_SNAPSHOT_LIMITS = Object.freeze({
  maxFiles: 5_000,
  maxFileBytes: 16 * 1024 * 1024,
  maxTotalBytes: 64 * 1024 * 1024,
  maxManifestBytes: 4 * 1024 * 1024,
});

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const CHILD_FILE = path.join(SCRIPT_DIR, 'seatbelt-sentinel-child.mjs');
const LAUNCHER_FILE = path.join(SCRIPT_DIR, 'run-seatbelt-sentinel.mjs');
const SKILL_ROOT = path.resolve(SCRIPT_DIR, '..');
const PLUGIN_ROOT = path.resolve(SKILL_ROOT, '../..');
const SANDBOX_BINARY = '/usr/bin/sandbox-exec';
const CODESIGN_BINARY = '/usr/bin/codesign';
const LS_BINARY = '/bin/ls';
const FIXED_TEMP_ROOT = '/private/tmp';
const CODEX_TEAM_IDENTIFIER = '2DC432GLL2';
const CODEX_IDENTIFIER = 'codex';
const CODEX_DESIGNATED_REQUIREMENT = 'identifier codex and anchor apple generic and certificate 1[field.1.2.840.113635.100.6.2.6] /* exists */ and certificate leaf[field.1.2.840.113635.100.6.1.13] /* exists */ and certificate leaf[subject.OU] = "2DC432GLL2"';
const LEDGER_PATHS = Object.freeze([
  'evals/ai-governance/outcomes.jsonl',
  'evals/ai-governance/trial-receipts.jsonl',
]);
const SHA256_PATTERN = /^[0-9a-f]{64}$/;
const REVISION_PATTERN = /^worktree-[0-9a-f]{64}$/;
const WORKTREE_REVISION_PROFILE = 'jsonutils-evolution-source-state-v2';
const CHILD_DENIED_EXIT = 73;
const COMMAND_TIMEOUT_MS = 2_000;
const MAX_COMMAND_OUTPUT = 256 * 1024;
export const SEATBELT_POLICY_TEMPLATE = Object.freeze({
  readAllow: '(version 1)\n(allow default)',
  readDeny: '(version 1)\n(allow default)\n(deny file-read* (subpath "{{READ_DENY_ROOT}}"))',
  writeDeny: '(version 1)\n(allow default)\n(deny file-write*)',
  networkDeny: '(version 1)\n(allow default)\n(deny network*)',
  processInfoDeny: '(version 1)\n(allow default)\n(deny process-info* (target others))',
  codexCapability: '(version 1)\n(allow default)\n(deny network*)\n(deny file-write*)',
});
const VALUE_FLAGS = Object.freeze([
  '--snapshot', '--live-checkout', '--snapshot-revision', '--snapshot-manifest-sha256',
  '--snapshot-tree-sha256', '--controller-bundle-sha256', '--child-bundle-sha256',
  '--node-runtime-sha256', '--launcher-bundle-sha256',
  '--policy-sha256', '--trial-nonce-sha256', '--sandbox-binary-sha256',
  '--codex-binary', '--codex-binary-sha256', '--codex-code-identity-sha256', '--codex-version',
  '--codex-sandbox-help-sha256', '--output',
]);

const hash = value => createHash('sha256').update(value).digest('hex');
const safeError = code => new Error(code);
const exactFields = (value, fields) => value && typeof value === 'object' && !Array.isArray(value)
  && Object.keys(value).length === fields.length && fields.every(field => Object.hasOwn(value, field));
const modeBits = stat => Number(stat.mode & 0o777n);
const unsafePathText = value => typeof value !== 'string' || value.length === 0
  || /['"\\\x00-\x1f\x7f]/.test(value);
const assertSafePathText = (value, code = 'argument-path-invalid') => {
  if (unsafePathText(value)) throw safeError(code);
  return value;
};
const isWithin = (parent, candidate) => {
  const relative = path.relative(parent, candidate);
  return relative === '' || (!path.isAbsolute(relative) && relative !== '..'
    && !relative.startsWith(`..${path.sep}`));
};
const isSafeSnapshotPath = value => typeof value === 'string' && value.length > 0
  && !unsafePathText(value) && !path.posix.isAbsolute(value)
  && value.normalize('NFC') === value && path.posix.normalize(value) === value
  && value !== '.' && value !== '..' && !value.startsWith('../')
  && value.split('/')[0] !== '.git';
const assertSha256 = (value, code) => {
  if (!SHA256_PATTERN.test(value ?? '')) throw safeError(code);
};
const sameStat = (left, right) => left.dev === right.dev && left.ino === right.ino
  && left.mode === right.mode && left.size === right.size && left.nlink === right.nlink
  && left.uid === right.uid && left.gid === right.gid
  && left.mtimeNs === right.mtimeNs && left.ctimeNs === right.ctimeNs;
const sameDirectoryIdentity = (left, right) => left.dev === right.dev && left.ino === right.ino
  && left.mode === right.mode && left.uid === right.uid
  && left.gid === right.gid;

const assertNoDirectoryAcl = (directory, code) => {
  const result = spawnSync(LS_BINARY, ['-lde', directory], {
    encoding: 'buffer', timeout: COMMAND_TIMEOUT_MS, maxBuffer: 64 * 1024,
    env: { PATH: '/usr/bin:/bin:/usr/sbin:/sbin', LANG: 'C', LC_ALL: 'C' },
  });
  const text = Buffer.isBuffer(result.stdout) ? result.stdout.toString('utf8') : '';
  if (result.status !== 0 || result.signal !== null || result.stderr?.length !== 0
    || text.split('\n').filter(Boolean).length !== 1
    || !/^d[-rwx]{9} /.test(text)) throw safeError(code);
};

const hashStableAbsoluteFile = (file, maxBytes = 512 * 1024 * 1024) => {
  const pathStat = fs.lstatSync(file, { bigint: true });
  if (!pathStat.isFile() || pathStat.isSymbolicLink() || pathStat.nlink !== 1n
    || pathStat.size < 0n || pathStat.size > BigInt(maxBytes) || fs.realpathSync(file) !== file) {
    throw safeError('bounded-hash-file-invalid');
  }
  const descriptor = fs.openSync(file, fs.constants.O_RDONLY | (fs.constants.O_NOFOLLOW ?? 0));
  try {
    const before = fs.fstatSync(descriptor, { bigint: true });
    if (!sameStat(pathStat, before)) throw safeError('bounded-hash-file-replaced');
    const digest = createHash('sha256');
    const buffer = Buffer.alloc(64 * 1024);
    let offset = 0;
    while (offset < Number(before.size)) {
      const count = fs.readSync(descriptor, buffer, 0,
        Math.min(buffer.length, Number(before.size) - offset), offset);
      if (count === 0) throw safeError('bounded-hash-file-short');
      digest.update(buffer.subarray(0, count));
      offset += count;
    }
    if (fs.readSync(descriptor, Buffer.alloc(1), 0, 1, offset) !== 0) {
      throw safeError('bounded-hash-file-growth');
    }
    const after = fs.fstatSync(descriptor, { bigint: true });
    if (!sameStat(before, after) || !sameStat(after, fs.lstatSync(file, { bigint: true }))) {
      throw safeError('bounded-hash-file-drift');
    }
    return digest.digest('hex');
  } finally { fs.closeSync(descriptor); }
};

const readExact = (descriptor, size) => {
  if (!Number.isSafeInteger(size) || size < 0) throw safeError('bounded-read-invalid');
  const bytes = Buffer.alloc(size);
  let offset = 0;
  while (offset < size) {
    const count = fs.readSync(descriptor, bytes, offset, size - offset, offset);
    if (count === 0) throw safeError('bounded-read-short');
    offset += count;
  }
  if (fs.readSync(descriptor, Buffer.alloc(1), 0, 1, size) !== 0) {
    throw safeError('bounded-read-growth');
  }
  return bytes;
};

const readStableFile = (root, relative, maxBytes, expectedStat = null) => {
  if (!isSafeSnapshotPath(relative)) throw safeError('snapshot-path-invalid');
  const absolute = path.join(root, ...relative.split('/'));
  const pathStat = fs.lstatSync(absolute, { bigint: true });
  if (!pathStat.isFile() || pathStat.isSymbolicLink() || pathStat.nlink !== 1n
    || pathStat.size > BigInt(maxBytes) || (expectedStat && !sameStat(pathStat, expectedStat))) {
    throw safeError('snapshot-file-invalid');
  }
  if (fs.realpathSync(absolute) !== absolute || !isWithin(root, absolute)) {
    throw safeError('snapshot-file-noncanonical');
  }
  const descriptor = fs.openSync(absolute, fs.constants.O_RDONLY | (fs.constants.O_NOFOLLOW ?? 0));
  try {
    const before = fs.fstatSync(descriptor, { bigint: true });
    if (!sameStat(pathStat, before)) throw safeError('snapshot-file-replaced');
    const bytes = readExact(descriptor, Number(before.size));
    const after = fs.fstatSync(descriptor, { bigint: true });
    const finalStat = fs.lstatSync(absolute, { bigint: true });
    if (!sameStat(before, after) || !sameStat(after, finalStat)
      || fs.realpathSync(absolute) !== absolute) throw safeError('snapshot-file-drift');
    return { bytes, stat: after };
  } finally { fs.closeSync(descriptor); }
};

const updateField = (digest, label, value) => {
  const bytes = Buffer.isBuffer(value) ? value : Buffer.from(String(value), 'utf8');
  digest.update(`${label}:${bytes.length}\0`, 'utf8');
  digest.update(bytes);
  digest.update('\0', 'utf8');
};

export const reproduceWorktreeRevision = ({ entries }) => {
  const digest = createHash('sha256');
  updateField(digest, 'profile', WORKTREE_REVISION_PROFILE);
  let lastPath = null;
  for (const entry of entries) {
    if (entry.revisionIncluded === false) continue;
    if (lastPath !== null && lastPath >= entry.path) throw safeError('snapshot-entry-order-invalid');
    lastPath = entry.path;
    updateField(digest, 'path', entry.path);
    if (entry.kind === 'deleted') updateField(digest, 'deleted', 'true');
    else {
      updateField(digest, 'mode', entry.executableBits);
      updateField(digest, 'file', entry.bytes);
    }
  }
  return `worktree-${digest.digest('hex')}`;
};

export const hashSealedSnapshotPayload = manifest => hash(JSON.stringify({
  domain: 'jsonutils.evolution.sealed-worktree-manifest/v1',
  value: { ...manifest, seal: { digestProfile: manifest.seal.digestProfile } },
}));

const assertCanonicalDirectory = (requested, code) => {
  assertSafePathText(requested, code);
  if (!path.isAbsolute(requested ?? '')) throw safeError(code);
  const resolved = path.resolve(requested);
  const canonical = fs.realpathSync(resolved);
  const stat = fs.lstatSync(resolved, { bigint: true });
  if (canonical !== resolved || !stat.isDirectory() || stat.isSymbolicLink()) throw safeError(code);
  return canonical;
};

const assertCanonicalRegularFile = (requested, code, maxBytes = Number.MAX_SAFE_INTEGER) => {
  assertSafePathText(requested, code);
  if (!path.isAbsolute(requested ?? '')) throw safeError(code);
  const resolved = path.resolve(requested);
  const canonical = fs.realpathSync(resolved);
  const stat = fs.lstatSync(resolved, { bigint: true });
  if (canonical !== resolved || !stat.isFile() || stat.isSymbolicLink() || stat.nlink !== 1n
    || stat.size > BigInt(maxBytes)) throw safeError(code);
  return canonical;
};

const enumerateSnapshot = (root) => {
  const files = new Map();
  const directories = new Map();
  const visit = (relativeDirectory) => {
    const absoluteDirectory = path.join(root, ...relativeDirectory.split('/').filter(Boolean));
    const stat = fs.lstatSync(absoluteDirectory, { bigint: true });
    if (!stat.isDirectory() || stat.isSymbolicLink() || modeBits(stat) !== 0o500) {
      throw safeError('snapshot-directory-invalid');
    }
    directories.set(relativeDirectory, stat);
    for (const name of fs.readdirSync(absoluteDirectory).sort()) {
      const relative = relativeDirectory ? `${relativeDirectory}/${name}` : name;
      if (!isSafeSnapshotPath(relative)) throw safeError('snapshot-path-invalid');
      const absolute = path.join(root, ...relative.split('/'));
      const entryStat = fs.lstatSync(absolute, { bigint: true });
      if (entryStat.isSymbolicLink()) throw safeError('snapshot-symlink-rejected');
      if (entryStat.isDirectory()) visit(relative);
      else if (entryStat.isFile()) {
        if (entryStat.nlink !== 1n) throw safeError('snapshot-hardlink-rejected');
        files.set(relative, entryStat);
      } else throw safeError('snapshot-special-file-rejected');
      if (files.size > SEALED_SNAPSHOT_LIMITS.maxFiles + 1) throw safeError('snapshot-file-limit');
    }
  };
  visit('');
  return { files, directories };
};

const expectedDirectories = entries => new Set(['', ...entries
  .filter(entry => entry.kind === 'file')
  .flatMap((entry) => {
    const parts = entry.path.split('/').slice(0, -1);
    return parts.map((_, index) => parts.slice(0, index + 1).join('/'));
  })]);

const snapshotStatRecord = stat => ({
  dev: String(stat.dev), ino: String(stat.ino), mode: String(stat.mode), size: String(stat.size),
  nlink: String(stat.nlink), uid: String(stat.uid), gid: String(stat.gid),
  mtimeNs: String(stat.mtimeNs), ctimeNs: String(stat.ctimeNs),
});

const hashSnapshotSourceState = ({ root, directories, files, fileEntries, manifestRead }) => {
  const directoryRecords = [...directories.keys()].sort().map((relative) => {
    const absolute = relative ? path.join(root, ...relative.split('/')) : root;
    const current = fs.lstatSync(absolute, { bigint: true });
    if (!sameStat(directories.get(relative), current) || fs.realpathSync(absolute) !== absolute) {
      throw safeError('snapshot-directory-drift');
    }
    return { path: relative, stat: snapshotStatRecord(current) };
  });
  const digestByPath = new Map(fileEntries.map(entry => [entry.path, entry.sha256]));
  digestByPath.set(SEALED_SNAPSHOT_MANIFEST, hash(manifestRead.bytes));
  const fileRecords = [...files.keys()].sort().map((relative) => {
    const absolute = path.join(root, ...relative.split('/'));
    const current = fs.lstatSync(absolute, { bigint: true });
    if (!sameStat(files.get(relative), current) || fs.realpathSync(absolute) !== absolute) {
      throw safeError('snapshot-file-drift');
    }
    return { path: relative, sha256: digestByPath.get(relative), stat: snapshotStatRecord(current) };
  });
  return hash(JSON.stringify({
    domain: 'jsonutils.evolution.snapshot-source-state/v2', directoryRecords, fileRecords,
  }));
};

export const verifySealedSnapshot = (requestedRoot) => {
  const root = assertCanonicalDirectory(requestedRoot, 'snapshot-root-invalid');
  if (fs.existsSync(path.join(root, '.git'))) throw safeError('snapshot-git-rejected');
  const manifestRead = readStableFile(
    root, SEALED_SNAPSHOT_MANIFEST, SEALED_SNAPSHOT_LIMITS.maxManifestBytes,
  );
  if (modeBits(manifestRead.stat) !== 0o400) throw safeError('snapshot-manifest-mode-invalid');
  const text = manifestRead.bytes.toString('utf8');
  let manifest;
  try { manifest = JSON.parse(text); } catch { throw safeError('snapshot-manifest-json-invalid'); }
  if (text !== JSON.stringify(manifest)) throw safeError('snapshot-manifest-encoding-invalid');
  const rootFields = ['schemaVersion', 'artifactType', 'manifestVersion', 'dataClass', 'source',
    'environmentBinding', 'entries', 'bounds', 'seal', 'claims'];
  const sourceFields = ['headOid', 'fixtureRevision', 'revisionProfile', 'inventoryProfile',
    'excludedFromRevision'];
  const entryFields = ['path', 'kind', 'sourceClass', 'revisionIncluded', 'executableBits',
    'byteLength', 'sha256', 'sealedMode'];
  if (!exactFields(manifest, rootFields) || !exactFields(manifest.source, sourceFields)
    || !exactFields(manifest.source.headOid, ['algorithm', 'value'])
    || !exactFields(manifest.environmentBinding, ['sha256', 'status'])
    || !exactFields(manifest.bounds, ['entryCount', 'fileCount', 'trackedEntries',
      'untrackedEntries', 'totalBytes', 'maxFiles', 'maxFileBytes', 'maxTotalBytes'])
    || !exactFields(manifest.seal, ['digestProfile', 'snapshotSha256'])
    || !exactFields(manifest.claims, ['evidenceScope', 'sourceIdentityVerified',
      'immutableMountVerified', 'externalHostVerified', 'environmentVerified',
      'runtimeIsolationVerified', 'currentTaskRegistryVerified', 'outcomeEligible'])
    || !Array.isArray(manifest.entries)) throw safeError('snapshot-manifest-shape-invalid');
  const oid = manifest.source.headOid;
  const validOid = oid.algorithm === 'sha1' ? /^[0-9a-f]{40}$/.test(oid.value)
    : oid.algorithm === 'sha256' && SHA256_PATTERN.test(oid.value);
  if (manifest.schemaVersion !== 1 || manifest.artifactType !== 'jsonutils-evolution-sealed-worktree'
    || manifest.manifestVersion !== '2.0.0' || manifest.dataClass !== 'repository-source-unreviewed'
    || !validOid || !REVISION_PATTERN.test(manifest.source.fixtureRevision)
    || manifest.source.revisionProfile !== WORKTREE_REVISION_PROFILE
    || manifest.source.inventoryProfile !== 'git-index-plus-unignored-untracked-v1'
    || JSON.stringify(manifest.source.excludedFromRevision) !== JSON.stringify(LEDGER_PATHS)
    || !SHA256_PATTERN.test(manifest.environmentBinding.sha256)
    || manifest.environmentBinding.status !== 'caller-bound-unverified'
    || manifest.seal.digestProfile !== 'jsonutils-evolution-sealed-worktree/v1'
    || !SHA256_PATTERN.test(manifest.seal.snapshotSha256)
    || JSON.stringify(manifest.claims) !== JSON.stringify({
      evidenceScope: 'component-only', sourceIdentityVerified: false,
      immutableMountVerified: false, externalHostVerified: false, environmentVerified: false,
      runtimeIsolationVerified: false, currentTaskRegistryVerified: false, outcomeEligible: false,
    })
    || manifest.entries.length === 0 || manifest.entries.length > SEALED_SNAPSHOT_LIMITS.maxFiles) {
    throw safeError('snapshot-manifest-contract-invalid');
  }
  const paths = manifest.entries.map(entry => entry?.path);
  if (new Set(paths).size !== paths.length
    || new Set(paths.map(value => value?.toLowerCase())).size !== paths.length
    || paths.some((value, index) => index > 0 && paths[index - 1] >= value)) {
    throw safeError('snapshot-entry-order-invalid');
  }
  for (const entry of manifest.entries) {
    const revisionIncluded = !LEDGER_PATHS.includes(entry.path);
    if (!exactFields(entry, entryFields) || !isSafeSnapshotPath(entry.path)
      || entry.path === SEALED_SNAPSHOT_MANIFEST || !['file', 'deleted'].includes(entry.kind)
      || !['tracked', 'untracked'].includes(entry.sourceClass)
      || entry.revisionIncluded !== revisionIncluded || !Number.isInteger(entry.executableBits)
      || entry.executableBits < 0 || (entry.executableBits & ~0o111) !== 0) {
      throw safeError('snapshot-entry-invalid');
    }
    if (entry.kind === 'deleted') {
      if (entry.sourceClass !== 'tracked' || entry.executableBits !== 0
        || entry.byteLength !== null || entry.sha256 !== null || entry.sealedMode !== null) {
        throw safeError('snapshot-deleted-entry-invalid');
      }
    } else if (!Number.isSafeInteger(entry.byteLength) || entry.byteLength < 0
      || entry.byteLength > SEALED_SNAPSHOT_LIMITS.maxFileBytes
      || !SHA256_PATTERN.test(entry.sha256)
      || entry.sealedMode !== (0o400 | entry.executableBits)) {
      throw safeError('snapshot-file-entry-invalid');
    }
  }
  const fileEntries = manifest.entries.filter(entry => entry.kind === 'file');
  const declaredTotal = fileEntries.reduce((sum, entry) => sum + entry.byteLength, 0);
  const expectedBounds = {
    entryCount: manifest.entries.length,
    fileCount: fileEntries.length,
    trackedEntries: manifest.entries.filter(entry => entry.sourceClass === 'tracked').length,
    untrackedEntries: manifest.entries.filter(entry => entry.sourceClass === 'untracked').length,
    totalBytes: declaredTotal,
    maxFiles: SEALED_SNAPSHOT_LIMITS.maxFiles,
    maxFileBytes: SEALED_SNAPSHOT_LIMITS.maxFileBytes,
    maxTotalBytes: SEALED_SNAPSHOT_LIMITS.maxTotalBytes,
  };
  if (declaredTotal > SEALED_SNAPSHOT_LIMITS.maxTotalBytes
    || JSON.stringify(manifest.bounds) !== JSON.stringify(expectedBounds)) {
    throw safeError('snapshot-bounds-invalid');
  }
  if (hashSealedSnapshotPayload(manifest) !== manifest.seal.snapshotSha256) {
    throw safeError('snapshot-manifest-digest-drift');
  }
  const { files, directories } = enumerateSnapshot(root);
  if (!files.has(SEALED_SNAPSHOT_MANIFEST)
    || !sameStat(files.get(SEALED_SNAPSHOT_MANIFEST), manifestRead.stat)) {
    throw safeError('snapshot-manifest-drift');
  }
  const actualFiles = [...files.keys()].filter(file => file !== SEALED_SNAPSHOT_MANIFEST).sort();
  const expectedFiles = fileEntries.map(entry => entry.path);
  if (JSON.stringify(actualFiles) !== JSON.stringify(expectedFiles)
    || JSON.stringify([...directories.keys()].sort())
      !== JSON.stringify([...expectedDirectories(manifest.entries)].sort())) {
    throw safeError('snapshot-exact-set-invalid');
  }
  let totalBytes = 0;
  const revisionEntries = [];
  for (const entry of manifest.entries) {
    if (entry.kind === 'deleted') {
      if (files.has(entry.path) || fs.existsSync(path.join(root, ...entry.path.split('/')))) {
        throw safeError('snapshot-deleted-entry-materialized');
      }
      revisionEntries.push(entry);
      continue;
    }
    const enumeratedStat = files.get(entry.path);
    const read = readStableFile(root, entry.path, SEALED_SNAPSHOT_LIMITS.maxFileBytes, enumeratedStat);
    const executableBits = Number(read.stat.mode & 0o111n);
    totalBytes += read.bytes.length;
    if (totalBytes > SEALED_SNAPSHOT_LIMITS.maxTotalBytes || modeBits(read.stat) !== entry.sealedMode
      || executableBits !== entry.executableBits || read.bytes.length !== entry.byteLength
      || hash(read.bytes) !== entry.sha256) throw safeError('snapshot-file-digest-drift');
    revisionEntries.push({ ...entry, bytes: read.bytes });
  }
  if (totalBytes !== declaredTotal) throw safeError('snapshot-total-drift');
  const reproducedRevision = reproduceWorktreeRevision({ entries: revisionEntries });
  if (reproducedRevision !== manifest.source.fixtureRevision) {
    throw safeError('snapshot-revision-drift');
  }
  const sourceStateSha256 = hashSnapshotSourceState({
    root, directories, files, fileEntries, manifestRead,
  });
  return Object.freeze({
    root,
    manifest,
    manifestPath: path.join(root, SEALED_SNAPSHOT_MANIFEST),
    manifestSha256: hash(manifestRead.bytes),
    treeSha256: manifest.seal.snapshotSha256,
    revision: reproducedRevision,
    ledgerCopiesPresent: LEDGER_PATHS.every(entry => files.has(entry)),
    sourceStateSha256,
    manifestBytes: Buffer.from(manifestRead.bytes),
  });
};

const hashBoundedDirectory = (requestedRoot) => {
  const root = assertCanonicalDirectory(requestedRoot, 'bundle-root-invalid');
  const entries = [];
  let totalBytes = 0;
  const visit = (relativeDirectory) => {
    const directory = path.join(root, ...relativeDirectory.split('/').filter(Boolean));
    const directoryBefore = fs.lstatSync(directory, { bigint: true });
    if (!directoryBefore.isDirectory() || directoryBefore.isSymbolicLink()
      || fs.realpathSync(directory) !== directory) throw safeError('bundle-directory-invalid');
    for (const name of fs.readdirSync(directory).sort()) {
      const relative = relativeDirectory ? `${relativeDirectory}/${name}` : name;
      assertSafePathText(relative, 'bundle-path-invalid');
      const absolute = path.join(root, ...relative.split('/'));
      const stat = fs.lstatSync(absolute, { bigint: true });
      if (stat.isSymbolicLink()) throw safeError('bundle-symlink-rejected');
      if (stat.isDirectory()) visit(relative);
      else if (stat.isFile() && stat.nlink === 1n) {
        if (stat.size > BigInt(SEALED_SNAPSHOT_LIMITS.maxFileBytes)) {
          throw safeError('bundle-file-limit');
        }
        if (fs.realpathSync(absolute) !== absolute) throw safeError('bundle-file-noncanonical');
        const sha256 = hashStableAbsoluteFile(absolute, SEALED_SNAPSHOT_LIMITS.maxFileBytes);
        if (!sameStat(stat, fs.lstatSync(absolute, { bigint: true }))) {
          throw safeError('bundle-file-drift');
        }
        totalBytes += Number(stat.size);
        entries.push({ path: relative, executableBits: Number(stat.mode & 0o111n),
          byteLength: Number(stat.size), sha256 });
      } else throw safeError('bundle-entry-rejected');
      if (entries.length > 1_000 || totalBytes > SEALED_SNAPSHOT_LIMITS.maxTotalBytes) {
        throw safeError('bundle-limit');
      }
    }
    if (!sameStat(directoryBefore, fs.lstatSync(directory, { bigint: true }))) {
      throw safeError('bundle-directory-drift');
    }
  };
  visit('');
  return hash(JSON.stringify({ domain: 'ai-infra-controller-probe/bundle/v1', entries }));
};

export const parseSeatbeltSentinelArgs = (argv) => {
  const values = {};
  for (let index = 0; index < argv.length; index += 1) {
    const flag = argv[index];
    if (!VALUE_FLAGS.includes(flag)) throw safeError('argument-unsupported');
    if (Object.hasOwn(values, flag)) throw safeError('argument-duplicate');
    const value = argv[index + 1];
    if (!value || value.startsWith('--')) throw safeError('argument-value-missing');
    values[flag] = value;
    index += 1;
  }
  if (VALUE_FLAGS.some(flag => !values[flag])) throw safeError('argument-required-missing');
  for (const flag of ['--snapshot-manifest-sha256', '--snapshot-tree-sha256',
    '--controller-bundle-sha256', '--child-bundle-sha256', '--node-runtime-sha256',
    '--launcher-bundle-sha256', '--policy-sha256',
    '--trial-nonce-sha256', '--sandbox-binary-sha256', '--codex-binary-sha256',
    '--codex-code-identity-sha256', '--codex-sandbox-help-sha256']) {
    assertSha256(values[flag], 'argument-digest-invalid');
  }
  if (!REVISION_PATTERN.test(values['--snapshot-revision'])) {
    throw safeError('argument-revision-invalid');
  }
  if (!/^[A-Za-z0-9][A-Za-z0-9 ._+\-]{0,127}$/.test(values['--codex-version'])) {
    throw safeError('argument-version-invalid');
  }
  for (const flag of ['--snapshot', '--live-checkout', '--codex-binary', '--output']) {
    assertSafePathText(values[flag]);
    if (!path.isAbsolute(values[flag])) throw safeError('argument-path-invalid');
  }
  return Object.freeze({
    snapshot: values['--snapshot'],
    liveCheckout: values['--live-checkout'],
    snapshotRevision: values['--snapshot-revision'],
    snapshotManifestSha256: values['--snapshot-manifest-sha256'],
    snapshotTreeSha256: values['--snapshot-tree-sha256'],
    controllerBundleSha256: values['--controller-bundle-sha256'],
    childBundleSha256: values['--child-bundle-sha256'],
    nodeRuntimeSha256: values['--node-runtime-sha256'],
    launcherBundleSha256: values['--launcher-bundle-sha256'],
    policySha256: values['--policy-sha256'],
    trialNonceSha256: values['--trial-nonce-sha256'],
    sandboxBinarySha256: values['--sandbox-binary-sha256'],
    codexBinary: values['--codex-binary'],
    codexBinarySha256: values['--codex-binary-sha256'],
    codexCodeIdentitySha256: values['--codex-code-identity-sha256'],
    codexVersion: values['--codex-version'],
    codexSandboxHelpSha256: values['--codex-sandbox-help-sha256'],
    output: values['--output'],
  });
};

const resolveBoundaries = (options) => {
  for (const constantPath of [PLUGIN_ROOT, CHILD_FILE, LAUNCHER_FILE, SANDBOX_BINARY,
    CODESIGN_BINARY, LS_BINARY, FIXED_TEMP_ROOT, process.execPath]) {
    assertSafePathText(constantPath, 'internal-path-invalid');
  }
  const pluginRoot = fs.realpathSync(PLUGIN_ROOT);
  const snapshotRoot = assertCanonicalDirectory(options.snapshot, 'snapshot-root-invalid');
  const liveCheckout = assertCanonicalDirectory(options.liveCheckout, 'live-checkout-invalid');
  const fixedTempRoot = assertCanonicalDirectory(FIXED_TEMP_ROOT, 'fixed-temp-root-invalid');
  if (fixedTempRoot !== FIXED_TEMP_ROOT) throw safeError('fixed-temp-root-invalid');
  const gitMetadata = path.join(liveCheckout, '.git');
  if (!fs.existsSync(gitMetadata)) throw safeError('live-checkout-git-missing');
  const liveSentinel = assertCanonicalRegularFile(
    path.join(liveCheckout, 'AGENTS.md'), 'live-checkout-sentinel-invalid', 1024 * 1024,
  );
  if (isWithin(snapshotRoot, liveCheckout) || isWithin(liveCheckout, snapshotRoot)
    || isWithin(pluginRoot, snapshotRoot) || isWithin(snapshotRoot, pluginRoot)) {
    throw safeError('snapshot-overlap-rejected');
  }
  const outputParent = assertCanonicalDirectory(path.dirname(options.output), 'output-parent-invalid');
  const outputParentStat = fs.lstatSync(outputParent, { bigint: true });
  const currentUid = typeof process.getuid === 'function' ? BigInt(process.getuid()) : -1n;
  if (modeBits(outputParentStat) !== 0o700 || outputParentStat.uid !== currentUid) {
    throw safeError('output-parent-security-invalid');
  }
  assertNoDirectoryAcl(outputParent, 'output-parent-acl-invalid');
  const output = path.join(outputParent, path.basename(options.output));
  if (fs.existsSync(output) || output !== path.resolve(options.output)
    || isWithin(pluginRoot, output) || isWithin(snapshotRoot, output)
    || isWithin(liveCheckout, output)) throw safeError('output-boundary-rejected');
  const codexBinary = assertCanonicalRegularFile(options.codexBinary, 'codex-binary-invalid');
  const nodeRuntime = assertCanonicalRegularFile(process.execPath, 'node-runtime-invalid');
  const childFile = assertCanonicalRegularFile(CHILD_FILE, 'child-binary-invalid', 1024 * 1024);
  const launcherFile = assertCanonicalRegularFile(
    LAUNCHER_FILE, 'launcher-invalid', 1024 * 1024,
  );
  const sandboxBinary = assertCanonicalRegularFile(SANDBOX_BINARY, 'sandbox-binary-invalid');
  const codesignBinary = assertCanonicalRegularFile(CODESIGN_BINARY, 'codesign-binary-invalid');
  const lsBinary = assertCanonicalRegularFile(LS_BINARY, 'ls-binary-invalid');
  if (childFile !== CHILD_FILE || launcherFile !== LAUNCHER_FILE
    || sandboxBinary !== SANDBOX_BINARY || codesignBinary !== CODESIGN_BINARY
    || lsBinary !== LS_BINARY) {
    throw safeError('internal-binary-invalid');
  }
  for (const root of [pluginRoot, liveCheckout, snapshotRoot, outputParent, fixedTempRoot]) {
    if (isWithin(root, codexBinary)) throw safeError('codex-binary-boundary-rejected');
  }
  return { pluginRoot, snapshotRoot, liveCheckout, liveSentinel, output, outputParent,
    outputParentStat, fixedTempRoot, codexBinary, nodeRuntime, childFile, launcherFile,
    sandboxBinary, codesignBinary };
};

const command = (file, args, env, timeout = COMMAND_TIMEOUT_MS) => new Promise((resolve) => {
  const child = execFile(file, args, {
    env, timeout, encoding: 'buffer', maxBuffer: MAX_COMMAND_OUTPUT, windowsHide: true,
  }, (error, stdout, stderr) => resolve({
    status: error ? (Number.isInteger(error.code) ? error.code : 1) : 0,
    stdout: Buffer.isBuffer(stdout) ? stdout : Buffer.from(stdout ?? ''),
    stderr: Buffer.isBuffer(stderr) ? stderr : Buffer.from(stderr ?? ''),
    timedOut: Boolean(error?.killed),
  }));
  child.stdin?.end();
});

const emptyDirectory = directory => fs.readdirSync(directory).length === 0;
const CODEX_CAPABILITY_WARNING = 'WARNING: proceeding, even though we could not create PATH aliases: Operation not permitted (os error 1)\n';
const codexCapabilityStderrClean = bytes => bytes.length === 0
  || bytes.toString('utf8') === CODEX_CAPABILITY_WARNING;
const fixedCommandEnv = Object.freeze({
  PATH: '/usr/bin:/bin:/usr/sbin:/sbin', LANG: 'C', LC_ALL: 'C', TERM: 'dumb', NO_COLOR: '1',
});

const inspectCodexCodeIdentity = async (codexBinary) => {
  const invalid = Object.freeze({ verified: false, codeIdentitySha256: null });
  const verify = await command(CODESIGN_BINARY,
    ['--verify', '--strict', '--verbose=4', codexBinary], fixedCommandEnv);
  const metadata = await command(CODESIGN_BINARY, ['-d', '--verbose=4', codexBinary], fixedCommandEnv);
  const requirement = await command(CODESIGN_BINARY, ['-d', '-r-', codexBinary], fixedCommandEnv);
  if ([verify, metadata, requirement].some(result => result.status !== 0 || result.timedOut)
    || verify.stdout.length !== 0 || metadata.stdout.length !== 0 || requirement.stdout.length === 0) {
    return invalid;
  }
  const metadataText = metadata.stderr.toString('utf8');
  const requirementText = requirement.stdout.toString('utf8');
  const identifier = metadataText.match(/^Identifier=([^\r\n]+)$/m)?.[1];
  const teamIdentifier = metadataText.match(/^TeamIdentifier=([^\r\n]+)$/m)?.[1];
  const flagsHex = metadataText.match(
    /^CodeDirectory .* flags=0x([0-9a-fA-F]+)\([^\r\n)]*\)(?: [^\r\n]*)?$/m,
  )?.[1];
  const cdHashFullSha256 = metadataText.match(
    /^CandidateCDHashFull sha256=([0-9a-f]{64})$/m,
  )?.[1];
  const designatedRequirement = requirementText.match(/^designated => ([^\r\n]+)$/m)?.[1];
  const authority = metadataText.match(/^Authority=([^\r\n]+)$/m)?.[1] ?? '';
  const hardenedRuntime = flagsHex !== undefined
    && (Number.parseInt(flagsHex, 16) & 0x10000) === 0x10000;
  if (identifier !== CODEX_IDENTIFIER || teamIdentifier !== CODEX_TEAM_IDENTIFIER
    || designatedRequirement !== CODEX_DESIGNATED_REQUIREMENT || !hardenedRuntime
    || !SHA256_PATTERN.test(cdHashFullSha256 ?? '')
    || !authority.startsWith('Developer ID Application: ')
    || !authority.endsWith(`(${CODEX_TEAM_IDENTIFIER})`)) return invalid;
  const codeIdentitySha256 = hash(JSON.stringify({
    domain: 'ai-infra-controller-probe/codex-code-identity/v2', identifier, teamIdentifier,
    hardenedRuntime, designatedRequirement, cdHashFullSha256,
  }));
  return Object.freeze({ verified: true, codeIdentitySha256 });
};

const preflightCodex = async ({ codexBinary, authHome, authCodex }) => {
  const env = {
    HOME: authHome,
    CODEX_HOME: authCodex,
    ...fixedCommandEnv,
    TMPDIR: authHome,
  };
  const version = await command(SANDBOX_BINARY,
    ['-p', SEATBELT_POLICY_TEMPLATE.codexCapability, codexBinary, '--version'], env);
  const sandboxHelp = await command(SANDBOX_BINARY,
    ['-p', SEATBELT_POLICY_TEMPLATE.codexCapability, codexBinary, 'sandbox', '--help'], env);
  const versionText = version.stdout.toString('utf8').trim();
  const rootsEmpty = emptyDirectory(authHome) && emptyDirectory(authCodex);
  return {
    versionStatus: version.status,
    versionText,
    versionOutputClean: !version.timedOut
      && codexCapabilityStderrClean(version.stderr)
      && /^[A-Za-z0-9][A-Za-z0-9 ._+\-]{0,127}$/.test(versionText),
    sandboxHelpStatus: sandboxHelp.status,
    sandboxHelpSha256: hash(sandboxHelp.stdout),
    sandboxHelpOutputClean: sandboxHelp.stdout.length > 0
      && codexCapabilityStderrClean(sandboxHelp.stderr)
      && !sandboxHelp.timedOut,
    rootsEmpty,
    seatbeltProfileObserved: !version.timedOut && !sandboxHelp.timedOut,
    childrenExited: !version.timedOut && !sandboxHelp.timedOut,
  };
};

export const collectCodexPreflightExpectations = async (codexBinary) => {
  assertSafePathText(codexBinary, 'codex-binary-invalid');
  const binary = assertCanonicalRegularFile(codexBinary, 'codex-binary-invalid');
  const fixedTempRoot = assertCanonicalDirectory(FIXED_TEMP_ROOT, 'fixed-temp-root-invalid');
  const pluginRoot = fs.realpathSync(PLUGIN_ROOT);
  if (isWithin(fixedTempRoot, binary) || isWithin(pluginRoot, binary)) {
    throw safeError('codex-binary-boundary-rejected');
  }
  const identityBefore = await inspectCodexCodeIdentity(binary);
  if (!identityBefore.verified) throw safeError('codex-code-identity-invalid');
  const binarySha256 = hashStableAbsoluteFile(binary);
  const root = fs.mkdtempSync(path.join(FIXED_TEMP_ROOT, 'codex-seatbelt-expect-'));
  fs.chmodSync(root, 0o700);
  const home = path.join(root, 'home');
  const codexHome = path.join(root, 'codex-home');
  fs.mkdirSync(home, { mode: 0o500 });
  fs.mkdirSync(codexHome, { mode: 0o500 });
  try {
    const preflight = await preflightCodex({ codexBinary: binary, authHome: home, authCodex: codexHome });
    if (preflight.versionStatus !== 0 || !preflight.versionOutputClean
      || preflight.sandboxHelpStatus !== 0 || !preflight.sandboxHelpOutputClean
      || !preflight.rootsEmpty || !preflight.seatbeltProfileObserved) {
      throw safeError('codex-preflight-invalid');
    }
    const identityAfter = await inspectCodexCodeIdentity(binary);
    if (!identityAfter.verified || identityAfter.codeIdentitySha256 !== identityBefore.codeIdentitySha256
      || hashStableAbsoluteFile(binary) !== binarySha256) throw safeError('codex-postflight-drift');
    return Object.freeze({
      codexBinarySha256: binarySha256,
      codexCodeIdentitySha256: identityBefore.codeIdentitySha256,
      codexVersion: preflight.versionText,
      codexSandboxHelpSha256: preflight.sandboxHelpSha256,
    });
  } finally {
    if (emptyDirectory(codexHome)) fs.rmdirSync(codexHome);
    if (emptyDirectory(home)) fs.rmdirSync(home);
    if (emptyDirectory(root)) fs.rmdirSync(root);
  }
};

const seatbeltStringContents = (value) => {
  return assertSafePathText(value, 'seatbelt-path-invalid');
};

const createReadDenyProfile = root => SEATBELT_POLICY_TEMPLATE.readDeny
  .replace('{{READ_DENY_ROOT}}', seatbeltStringContents(root));

const policyTemplateSha256 = () => hash(JSON.stringify(SEATBELT_POLICY_TEMPLATE));

export const collectSeatbeltSentinelStaticExpectations = () => Object.freeze({
  controllerBundleSha256: hashBoundedDirectory(fs.realpathSync(PLUGIN_ROOT)),
  childBundleSha256: hashStableAbsoluteFile(fs.realpathSync(CHILD_FILE), 1024 * 1024),
  nodeRuntimeSha256: hashStableAbsoluteFile(fs.realpathSync(process.execPath)),
  launcherBundleSha256: hashStableAbsoluteFile(fs.realpathSync(LAUNCHER_FILE), 1024 * 1024),
  policySha256: policyTemplateSha256(),
  sandboxBinarySha256: hashStableAbsoluteFile(fs.realpathSync(SANDBOX_BINARY)),
});

const objectIdentityMatches = (expected, actual) => expected.dev === actual.dev
  && expected.ino === actual.ino && expected.uid === actual.uid && expected.gid === actual.gid;

const createTempState = (snapshot) => {
  const root = fs.mkdtempSync(path.join(FIXED_TEMP_ROOT, 'codex-seatbelt-sentinel-'));
  fs.chmodSync(root, 0o700);
  if (fs.realpathSync(root) !== root) throw safeError('temp-root-invalid');
  const directories = new Map([[root, fs.lstatSync(root, { bigint: true })]]);
  const makeDirectory = (name) => {
    const directory = path.join(root, name);
    fs.mkdirSync(directory, { mode: 0o700 });
    directories.set(directory, fs.lstatSync(directory, { bigint: true }));
    return directory;
  };
  const secretRoot = makeDirectory('secret');
  const mirrorRoot = makeDirectory('snapshot-mirror');
  const authHome = makeDirectory('home');
  const authCodex = makeDirectory('codex-home');
  fs.chmodSync(authHome, 0o500);
  fs.chmodSync(authCodex, 0o500);
  const secretFile = path.join(secretRoot, 'synthetic-canary');
  const mirrorManifest = path.join(mirrorRoot, SEALED_SNAPSHOT_MANIFEST);
  const mirrorBaselineWrite = path.join(mirrorRoot, 'baseline-write-control');
  const mirrorDeniedWrite = path.join(mirrorRoot, 'sandbox-write-control');
  const canary = randomBytes(32);
  fs.writeFileSync(secretFile, canary, { flag: 'wx', mode: 0o600 });
  fs.writeFileSync(mirrorManifest, snapshot.manifestBytes, { flag: 'wx', mode: 0o400 });
  const fileIdentities = new Map([
    [secretFile, fs.lstatSync(secretFile, { bigint: true })],
    [mirrorManifest, fs.lstatSync(mirrorManifest, { bigint: true })],
  ]);
  return { root, rootIdentity: directories.get(root), directories,
    files: [secretFile, mirrorManifest, mirrorBaselineWrite, mirrorDeniedWrite],
    fileIdentities,
    secretRoot, secretFile, mirrorRoot, mirrorManifest, mirrorBaselineWrite, mirrorDeniedWrite,
    authHome, authCodex, canarySha256: hash(canary) };
};

const countResidual = (root, limit = 1_000) => {
  return Math.min(fs.readdirSync(root).length, limit);
};

const removeKnownTempFile = (state, file) => {
  if (!isWithin(state.root, file) || !state.files.includes(file)) return false;
  try {
    const stat = fs.lstatSync(file, { bigint: true });
    const expected = state.fileIdentities.get(file);
    const currentUid = typeof process.getuid === 'function' ? BigInt(process.getuid()) : -1n;
    if (!expected || !objectIdentityMatches(expected, stat)
      || !stat.isFile() || stat.isSymbolicLink() || stat.nlink !== 1n || stat.uid !== currentUid
      || fs.realpathSync(file) !== file) return false;
    fs.chmodSync(file, 0o600);
    fs.unlinkSync(file);
    return true;
  } catch (error) { return error.code === 'ENOENT'; }
};

const cleanupTempState = (state) => {
  let rootValid = false;
  try {
    const stat = fs.lstatSync(state.root, { bigint: true });
    rootValid = stat.isDirectory() && !stat.isSymbolicLink() && modeBits(stat) === 0o700
      && objectIdentityMatches(state.rootIdentity, stat) && fs.realpathSync(state.root) === state.root;
  } catch { rootValid = false; }
  if (!rootValid) return { tempEntriesRemoved: false, residualNonceObjects: 1 };
  for (const file of state.files) {
    removeKnownTempFile(state, file);
  }
  for (const [directory, expected] of [...state.directories.entries()].reverse()) {
    try {
      const actual = fs.lstatSync(directory, { bigint: true });
      if (actual.isDirectory() && !actual.isSymbolicLink()
        && objectIdentityMatches(expected, actual) && emptyDirectory(directory)) {
        fs.rmdirSync(directory);
      }
    }
    catch { /* 保留 owner-only 残留比递归删除更安全 */ }
  }
  const retained = fs.existsSync(state.root);
  return {
    tempEntriesRemoved: !retained,
    residualNonceObjects: retained ? countResidual(state.root) : 0,
  };
};

const hashDisposableMirror = (state) => {
  if (fs.realpathSync(state.mirrorRoot) !== state.mirrorRoot
    || modeBits(fs.lstatSync(state.mirrorRoot, { bigint: true })) !== 0o700
    || JSON.stringify(fs.readdirSync(state.mirrorRoot).sort())
      !== JSON.stringify([SEALED_SNAPSHOT_MANIFEST])) throw safeError('mirror-shape-invalid');
  const read = readStableFile(
    state.mirrorRoot, SEALED_SNAPSHOT_MANIFEST, SEALED_SNAPSHOT_LIMITS.maxManifestBytes,
  );
  if (modeBits(read.stat) !== 0o400) throw safeError('mirror-mode-invalid');
  return hash(JSON.stringify({
    domain: 'ai-infra-controller-probe/disposable-snapshot-mirror/v2',
    manifestSha256: hash(read.bytes), manifestMode: modeBits(read.stat), rootMode: 0o700,
  }));
};

const childCall = (operation, args, env) => command(process.execPath, [CHILD_FILE, operation, ...args], env);
const sandboxCall = (profile, operation, args, env) => command(
  SANDBOX_BINARY, ['-p', profile, process.execPath, CHILD_FILE, operation, ...args], env,
);
const cleanChildResult = result => result.stdout.length === 0 && result.stderr.length === 0
  && !result.timedOut;
const childPassed = result => result.status === 0 && cleanChildResult(result);
const childDenied = result => result.status === CHILD_DENIED_EXIT && cleanChildResult(result);
const validateAndRemoveMirrorWrite = (state, result) => {
  let valid = false;
  try {
    const stat = fs.lstatSync(state.mirrorBaselineWrite, { bigint: true });
    valid = childPassed(result) && stat.isFile() && !stat.isSymbolicLink() && stat.nlink === 1n
      && hashStableAbsoluteFile(state.mirrorBaselineWrite, 1024) === hash('synthetic-only\n');
    if (valid) state.fileIdentities.set(state.mirrorBaselineWrite, stat);
  } catch { valid = false; }
  return valid && removeKnownTempFile(state, state.mirrorBaselineWrite);
};

const listenLoopback = () => new Promise((resolve, reject) => {
  const server = net.createServer(socket => socket.end());
  server.once('error', reject);
  server.listen(0, '127.0.0.1', () => resolve(server));
});
const closeServer = server => new Promise(resolve => server.close(() => resolve()));
const stopSibling = sibling => new Promise((resolve) => {
  if (sibling.exitCode !== null || sibling.signalCode !== null) { resolve(true); return; }
  const timeout = setTimeout(() => resolve(false), 1_000);
  sibling.once('close', () => { clearTimeout(timeout); resolve(true); });
  sibling.kill('SIGKILL');
});

const emptyObservations = canarySha256 => ({
  codexPreflight: { staticBindingsMatched: false, codeIdentityMatched: false,
    versionMatched: false, sandboxHelpMatched: false, seatbeltProfileObserved: false,
    postflightBindingsMatched: false },
  syntheticSecret: { baselineReadObserved: false, sandboxReadDenied: false, canarySha256 },
  liveCheckout: { baselineReadObserved: false, sandboxReadDenied: false },
  snapshot: { sourceMutationAttempted: false, sourceDigestBefore: null, sourceDigestAfter: null,
    manifestReadObserved: false, manifestReadSha256: null, ledgerCopiesPresent: false,
    disposableMirrorBaselineChmodObserved: false, disposableMirrorBaselineWriteObserved: false,
    disposableMirrorChmodDenied: false, disposableMirrorWriteDenied: false,
    disposableMirrorDigestBefore: null, disposableMirrorDigestAfter: null },
  network: { loopbackBaselineConnected: false, sandboxLoopbackDenied: false },
  processInfo: { siblingBaselineVisible: false, sandboxSiblingInfoDenied: false,
    sameUidObserved: false },
  cleanup: { childrenExited: false, tempEntriesRemoved: false, residualNonceObjects: 0 },
});

const buildClaims = observations => {
  const syntheticSecretPolicyObserved = observations.syntheticSecret.baselineReadObserved
    && observations.syntheticSecret.sandboxReadDenied;
  const snapshotIntegrityObserved = observations.snapshot.manifestReadObserved
    && observations.snapshot.sourceMutationAttempted === false
    && observations.snapshot.sourceDigestBefore !== null
    && observations.snapshot.sourceDigestBefore === observations.snapshot.sourceDigestAfter
    && observations.snapshot.disposableMirrorBaselineChmodObserved
    && observations.snapshot.disposableMirrorBaselineWriteObserved
    && observations.snapshot.disposableMirrorChmodDenied
    && observations.snapshot.disposableMirrorWriteDenied
    && observations.snapshot.disposableMirrorDigestBefore !== null
    && observations.snapshot.disposableMirrorDigestBefore
      === observations.snapshot.disposableMirrorDigestAfter;
  const networkPolicyObserved = observations.network.loopbackBaselineConnected
    && observations.network.sandboxLoopbackDenied;
  const processInfoPolicyObserved = observations.processInfo.siblingBaselineVisible
    && observations.processInfo.sandboxSiblingInfoDenied && observations.processInfo.sameUidObserved;
  const boundedCleanupObserved = observations.cleanup.childrenExited
    && observations.cleanup.tempEntriesRemoved && observations.cleanup.residualNonceObjects === 0;
  return {
    seatbeltPolicyObserved: syntheticSecretPolicyObserved
      && observations.liveCheckout.baselineReadObserved && observations.liveCheckout.sandboxReadDenied
      && snapshotIntegrityObserved && networkPolicyObserved && processInfoPolicyObserved
      && observations.codexPreflight.staticBindingsMatched
      && observations.codexPreflight.codeIdentityMatched
      && observations.codexPreflight.versionMatched
      && observations.codexPreflight.sandboxHelpMatched
      && observations.codexPreflight.seatbeltProfileObserved
      && observations.codexPreflight.postflightBindingsMatched,
    snapshotIntegrityObserved,
    syntheticSecretPolicyObserved,
    networkPolicyObserved,
    processInfoPolicyObserved,
    boundedCleanupObserved,
    secretIsolationVerified: false,
    immutableMountVerified: false,
    pidNamespaceVerified: false,
    userNamespaceVerified: false,
    controllerIsolationVerified: false,
    signerIsolationVerified: false,
    trustedSigners: 0,
    modelInvocationAbsenceVerified: false,
    currentTaskRegistryVerified: false,
    topologyComplete: false,
    outcomeEligible: false,
    confirmedCoverageEligible: false,
  };
};

const assertOutputParentStable = (boundaries, expectedLinkDelta = 0n) => {
  const current = fs.lstatSync(boundaries.outputParent, { bigint: true });
  if (!current.isDirectory() || current.isSymbolicLink() || modeBits(current) !== 0o700
    || fs.realpathSync(boundaries.outputParent) !== boundaries.outputParent
    || !sameDirectoryIdentity(boundaries.outputParentStat, current)
    || current.nlink !== boundaries.outputParentStat.nlink + expectedLinkDelta) {
    throw safeError('output-parent-drift');
  }
  assertNoDirectoryAcl(boundaries.outputParent, 'output-parent-acl-drift');
  return current;
};

const writeReport = (boundaries, report) => {
  assertOutputParentStable(boundaries);
  if (fs.existsSync(boundaries.output)) throw safeError('output-exists');
  const bytes = Buffer.from(JSON.stringify(report), 'utf8');
  if (bytes.length === 0 || bytes.length > 128 * 1024) throw safeError('output-size-invalid');
  const parentDescriptor = fs.openSync(boundaries.outputParent,
    fs.constants.O_RDONLY | (fs.constants.O_DIRECTORY ?? 0) | (fs.constants.O_NOFOLLOW ?? 0));
  try {
    const openedParent = fs.fstatSync(parentDescriptor, { bigint: true });
    if (!openedParent.isDirectory() || !sameDirectoryIdentity(boundaries.outputParentStat, openedParent)
      || openedParent.nlink !== boundaries.outputParentStat.nlink) {
      throw safeError('output-parent-descriptor-drift');
    }
    const descriptor = fs.openSync(boundaries.output, fs.constants.O_WRONLY | fs.constants.O_CREAT
      | fs.constants.O_EXCL | (fs.constants.O_NOFOLLOW ?? 0), 0o600);
    let descriptorStat;
    try {
      fs.fchmodSync(descriptor, 0o600);
      let offset = 0;
      while (offset < bytes.length) {
        const count = fs.writeSync(descriptor, bytes, offset, bytes.length - offset);
        if (count === 0) throw safeError('output-write-short');
        offset += count;
      }
      fs.fsyncSync(descriptor);
      descriptorStat = fs.fstatSync(descriptor, { bigint: true });
      const currentUid = typeof process.getuid === 'function' ? BigInt(process.getuid()) : -1n;
      if (modeBits(descriptorStat) !== 0o600 || !descriptorStat.isFile()
        || descriptorStat.isSymbolicLink() || descriptorStat.nlink !== 1n
        || descriptorStat.uid !== currentUid || descriptorStat.size !== BigInt(bytes.length)) {
        throw safeError('output-mode-invalid');
      }
    } finally { fs.closeSync(descriptor); }
    fs.fsyncSync(parentDescriptor);
    const pathStat = fs.lstatSync(boundaries.output, { bigint: true });
    if (!pathStat.isFile() || pathStat.isSymbolicLink() || pathStat.nlink !== 1n
      || pathStat.dev !== descriptorStat.dev || pathStat.ino !== descriptorStat.ino
      || pathStat.size !== descriptorStat.size || modeBits(pathStat) !== 0o600
      || fs.realpathSync(boundaries.output) !== boundaries.output) throw safeError('output-inode-drift');
    const closedParent = fs.fstatSync(parentDescriptor, { bigint: true });
    if (!sameDirectoryIdentity(openedParent, closedParent)
      || closedParent.nlink !== openedParent.nlink + 1n) {
      throw safeError('output-parent-descriptor-drift');
    }
    assertOutputParentStable(boundaries, 1n);
    return hash(bytes);
  } finally { fs.closeSync(parentDescriptor); }
};

export const runSeatbeltSentinel = async ({ argv, env = process.env } = {}) => {
  if (process.platform !== 'darwin') throw safeError('platform-unsupported');
  if (['CODEX_API_KEY', 'OPENAI_API_KEY'].some(name => Object.hasOwn(env, name))) {
    throw safeError('credential-environment-rejected');
  }
  const options = parseSeatbeltSentinelArgs(argv ?? []);
  const boundaries = resolveBoundaries(options);
  const snapshotBefore = verifySealedSnapshot(boundaries.snapshotRoot);
  const controllerBundleSha256 = hashBoundedDirectory(boundaries.pluginRoot);
  const childBundleSha256 = hashStableAbsoluteFile(boundaries.childFile, 1024 * 1024);
  const nodeRuntimeSha256 = hashStableAbsoluteFile(boundaries.nodeRuntime);
  const launcherBundleSha256 = hashStableAbsoluteFile(boundaries.launcherFile, 1024 * 1024);
  const policySha256 = policyTemplateSha256();
  const sandboxBinarySha256 = hashStableAbsoluteFile(boundaries.sandboxBinary);
  const codexBinarySha256 = hashStableAbsoluteFile(boundaries.codexBinary);
  const codexIdentity = await inspectCodexCodeIdentity(boundaries.codexBinary);
  const observations = emptyObservations(null);
  observations.snapshot.sourceDigestBefore = snapshotBefore.sourceStateSha256;
  observations.snapshot.ledgerCopiesPresent = snapshotBefore.ledgerCopiesPresent;
  const failures = [];
  let sandboxCommandObserved = false;
  let childrenExited = true;
  const bindings = {
    snapshotRevision: options.snapshotRevision,
    snapshotManifestSha256: options.snapshotManifestSha256,
    snapshotTreeSha256: options.snapshotTreeSha256,
    controllerBundleSha256: options.controllerBundleSha256,
    childBundleSha256: options.childBundleSha256,
    nodeRuntimeSha256: options.nodeRuntimeSha256,
    launcherBundleSha256: options.launcherBundleSha256,
    policySha256: options.policySha256,
    trialNonceSha256: options.trialNonceSha256,
    sandboxBinarySha256: options.sandboxBinarySha256,
    codexBinarySha256: options.codexBinarySha256,
    codexCodeIdentitySha256: options.codexCodeIdentitySha256,
    codexVersion: options.codexVersion,
    codexSandboxHelpSha256: options.codexSandboxHelpSha256,
  };
  if (sandboxBinarySha256 !== options.sandboxBinarySha256) {
    failures.push('sandbox-binary-digest-mismatch');
  }
  if (controllerBundleSha256 !== options.controllerBundleSha256) {
    failures.push('controller-bundle-digest-mismatch');
  }
  if (childBundleSha256 !== options.childBundleSha256) failures.push('child-bundle-digest-mismatch');
  if (nodeRuntimeSha256 !== options.nodeRuntimeSha256) failures.push('node-runtime-digest-mismatch');
  if (launcherBundleSha256 !== options.launcherBundleSha256) {
    failures.push('launcher-bundle-digest-mismatch');
  }
  if (policySha256 !== options.policySha256) failures.push('policy-digest-mismatch');
  if (codexBinarySha256 !== options.codexBinarySha256) failures.push('codex-binary-digest-mismatch');
  if (!codexIdentity.verified
    || codexIdentity.codeIdentitySha256 !== options.codexCodeIdentitySha256) {
    failures.push('codex-code-identity-mismatch');
  }
  if (snapshotBefore.revision !== options.snapshotRevision) failures.push('snapshot-revision-mismatch');
  if (snapshotBefore.manifestSha256 !== options.snapshotManifestSha256) {
    failures.push('snapshot-manifest-digest-mismatch');
  }
  if (snapshotBefore.treeSha256 !== options.snapshotTreeSha256) {
    failures.push('snapshot-tree-digest-mismatch');
  }
  observations.codexPreflight.codeIdentityMatched = codexIdentity.verified
    && codexIdentity.codeIdentitySha256 === options.codexCodeIdentitySha256;
  if (failures.length > 0) failures.push('static-binding-mismatch');
  observations.codexPreflight.staticBindingsMatched = failures.length === 0;

  if (observations.codexPreflight.staticBindingsMatched) {
    const temp = createTempState(snapshotBefore);
    observations.syntheticSecret.canarySha256 = temp.canarySha256;
    observations.snapshot.disposableMirrorDigestBefore = hashDisposableMirror(temp);
    const minimalEnv = { ...fixedCommandEnv, HOME: temp.authHome, CODEX_HOME: temp.authCodex,
      TMPDIR: temp.root };
    const secretProfile = createReadDenyProfile(temp.secretRoot);
    const liveCheckoutProfile = createReadDenyProfile(boundaries.liveCheckout);
    try {
      try {
        const codexPreflight = await preflightCodex({ codexBinary: boundaries.codexBinary,
          authHome: temp.authHome, authCodex: temp.authCodex });
        sandboxCommandObserved = codexPreflight.seatbeltProfileObserved;
        childrenExited &&= codexPreflight.childrenExited;
        observations.codexPreflight.versionMatched = codexPreflight.versionStatus === 0
          && codexPreflight.versionOutputClean && codexPreflight.versionText === options.codexVersion;
        observations.codexPreflight.sandboxHelpMatched = codexPreflight.sandboxHelpStatus === 0
          && codexPreflight.sandboxHelpOutputClean
          && codexPreflight.sandboxHelpSha256 === options.codexSandboxHelpSha256
          && codexPreflight.rootsEmpty;
        observations.codexPreflight.seatbeltProfileObserved = codexPreflight.seatbeltProfileObserved;
        if (!observations.codexPreflight.versionMatched) failures.push('codex-version-mismatch');
        if (!observations.codexPreflight.sandboxHelpMatched) failures.push('codex-sandbox-help-mismatch');
        if (!observations.codexPreflight.seatbeltProfileObserved) {
          failures.push('codex-seatbelt-profile-not-observed');
        }

        const secretBaselineBefore = await childCall(
          'read-file', [temp.secretFile, temp.canarySha256], minimalEnv,
        );
        const secretDenied = await sandboxCall(
          secretProfile, 'read-file', [temp.secretFile, temp.canarySha256], minimalEnv,
        );
        const secretBaselineAfter = await childCall(
          'read-file', [temp.secretFile, temp.canarySha256], minimalEnv,
        );
        sandboxCommandObserved = true;
        childrenExited &&= !secretBaselineBefore.timedOut && !secretDenied.timedOut
          && !secretBaselineAfter.timedOut;
        const secretBaselineStable = childPassed(secretBaselineBefore)
          && childPassed(secretBaselineAfter);
        observations.syntheticSecret.baselineReadObserved = secretBaselineStable;
        observations.syntheticSecret.sandboxReadDenied = secretBaselineStable
          && childDenied(secretDenied);

        const liveSha256 = hashStableAbsoluteFile(boundaries.liveSentinel, 1024 * 1024);
        const liveBaselineBefore = await childCall(
          'read-file', [boundaries.liveSentinel, liveSha256], minimalEnv,
        );
        const liveDenied = await sandboxCall(
          liveCheckoutProfile, 'read-file', [boundaries.liveSentinel, liveSha256], minimalEnv,
        );
        const liveBaselineAfter = await childCall(
          'read-file', [boundaries.liveSentinel, liveSha256], minimalEnv,
        );
        childrenExited &&= !liveBaselineBefore.timedOut && !liveDenied.timedOut
          && !liveBaselineAfter.timedOut;
        const liveBaselineStable = childPassed(liveBaselineBefore)
          && childPassed(liveBaselineAfter);
        observations.liveCheckout.baselineReadObserved = liveBaselineStable;
        observations.liveCheckout.sandboxReadDenied = liveBaselineStable
          && childDenied(liveDenied);

        const manifestRead = await sandboxCall(SEATBELT_POLICY_TEMPLATE.readAllow, 'read-file',
          [snapshotBefore.manifestPath, snapshotBefore.manifestSha256], minimalEnv);
        childrenExited &&= !manifestRead.timedOut;
        observations.snapshot.manifestReadObserved = childPassed(manifestRead);
        observations.snapshot.manifestReadSha256 = observations.snapshot.manifestReadObserved
          ? snapshotBefore.manifestSha256 : null;

        const mirrorChmodBaselineBefore = await childCall(
          'chmod-file', [temp.mirrorManifest, '600'], minimalEnv,
        );
        childrenExited &&= !mirrorChmodBaselineBefore.timedOut;
        const mirrorChmodBeforeObserved = childPassed(mirrorChmodBaselineBefore)
          && modeBits(fs.lstatSync(temp.mirrorManifest, { bigint: true })) === 0o600;
        fs.chmodSync(temp.mirrorManifest, 0o400);
        const mirrorChmodDenied = await sandboxCall(SEATBELT_POLICY_TEMPLATE.writeDeny,
          'chmod-file', [temp.mirrorManifest, '600'], minimalEnv);
        childrenExited &&= !mirrorChmodDenied.timedOut;
        const mirrorModeStableAfterDeny
          = modeBits(fs.lstatSync(temp.mirrorManifest, { bigint: true })) === 0o400;
        const mirrorChmodBaselineAfter = await childCall(
          'chmod-file', [temp.mirrorManifest, '600'], minimalEnv,
        );
        childrenExited &&= !mirrorChmodBaselineAfter.timedOut;
        const mirrorChmodAfterObserved = childPassed(mirrorChmodBaselineAfter)
          && modeBits(fs.lstatSync(temp.mirrorManifest, { bigint: true })) === 0o600;
        fs.chmodSync(temp.mirrorManifest, 0o400);
        const mirrorChmodBaselineStable = mirrorChmodBeforeObserved && mirrorChmodAfterObserved;
        observations.snapshot.disposableMirrorBaselineChmodObserved
          = mirrorChmodBaselineStable;
        observations.snapshot.disposableMirrorChmodDenied = mirrorChmodBaselineStable
          && mirrorModeStableAfterDeny && childDenied(mirrorChmodDenied);

        const mirrorWriteBaselineBefore = await childCall(
          'create-file', [temp.mirrorBaselineWrite], minimalEnv,
        );
        childrenExited &&= !mirrorWriteBaselineBefore.timedOut;
        const mirrorWriteBeforeObserved
          = validateAndRemoveMirrorWrite(temp, mirrorWriteBaselineBefore);
        const mirrorWriteDenied = await sandboxCall(SEATBELT_POLICY_TEMPLATE.writeDeny,
          'create-file', [temp.mirrorDeniedWrite], minimalEnv);
        childrenExited &&= !mirrorWriteDenied.timedOut;
        const mirrorDeniedTargetAbsent = !fs.existsSync(temp.mirrorDeniedWrite);
        const mirrorWriteBaselineAfter = await childCall(
          'create-file', [temp.mirrorBaselineWrite], minimalEnv,
        );
        childrenExited &&= !mirrorWriteBaselineAfter.timedOut;
        const mirrorWriteAfterObserved
          = validateAndRemoveMirrorWrite(temp, mirrorWriteBaselineAfter);
        const mirrorWriteBaselineStable = mirrorWriteBeforeObserved && mirrorWriteAfterObserved;
        observations.snapshot.disposableMirrorBaselineWriteObserved = mirrorWriteBaselineStable;
        observations.snapshot.disposableMirrorWriteDenied = mirrorWriteBaselineStable
          && mirrorDeniedTargetAbsent && childDenied(mirrorWriteDenied);
        observations.snapshot.disposableMirrorDigestAfter = hashDisposableMirror(temp);

        const server = await listenLoopback();
        try {
          const port = String(server.address().port);
          const baselineNetworkBefore = await childCall('connect-loopback', [port], minimalEnv);
          const deniedNetwork = await sandboxCall(
            SEATBELT_POLICY_TEMPLATE.networkDeny, 'connect-loopback', [port], minimalEnv,
          );
          const baselineNetworkAfter = await childCall('connect-loopback', [port], minimalEnv);
          childrenExited &&= !baselineNetworkBefore.timedOut && !deniedNetwork.timedOut
            && !baselineNetworkAfter.timedOut;
          const networkBaselineStable = childPassed(baselineNetworkBefore)
            && childPassed(baselineNetworkAfter);
          observations.network.loopbackBaselineConnected = networkBaselineStable;
          observations.network.sandboxLoopbackDenied = networkBaselineStable
            && childDenied(deniedNetwork);
        } finally { await closeServer(server); }

        const sibling = spawn('/bin/sleep', ['5'], { stdio: 'ignore',
          env: { PATH: '/usr/bin:/bin', SENTINEL_FAKE_ONLY: '1' } });
        try {
          await new Promise(resolve => setTimeout(resolve, 50));
          const uid = typeof process.getuid === 'function' ? process.getuid() : -1;
          const baselineProcessBefore = await childCall(
            'inspect-process', [String(sibling.pid), String(uid)], minimalEnv,
          );
          const deniedProcess = await sandboxCall(SEATBELT_POLICY_TEMPLATE.processInfoDeny,
            'inspect-process', [String(sibling.pid), String(uid)], minimalEnv);
          const siblingAliveBeforePost = sibling.exitCode === null && sibling.signalCode === null;
          const baselineProcessAfter = await childCall(
            'inspect-process', [String(sibling.pid), String(uid)], minimalEnv,
          );
          const siblingAliveAfterPost = sibling.exitCode === null && sibling.signalCode === null;
          childrenExited &&= !baselineProcessBefore.timedOut && !deniedProcess.timedOut
            && !baselineProcessAfter.timedOut;
          const processBaselineStable = siblingAliveBeforePost && siblingAliveAfterPost
            && childPassed(baselineProcessBefore) && childPassed(baselineProcessAfter);
          observations.processInfo.siblingBaselineVisible = processBaselineStable;
          observations.processInfo.sandboxSiblingInfoDenied = processBaselineStable
            && childDenied(deniedProcess);
          observations.processInfo.sameUidObserved = uid > 0 && processBaselineStable;
        } finally { childrenExited &&= await stopSibling(sibling); }
      } catch { /* 对应的闭字段观察保持 false，由派生失败 ID 表达 */ }

      try {
        const snapshotAfter = verifySealedSnapshot(boundaries.snapshotRoot);
        observations.snapshot.sourceDigestAfter = snapshotAfter.sourceStateSha256;
        const identityAfter = await inspectCodexCodeIdentity(boundaries.codexBinary);
        const postflight = {
          controllerBundleSha256: hashBoundedDirectory(boundaries.pluginRoot),
          childBundleSha256: hashStableAbsoluteFile(boundaries.childFile, 1024 * 1024),
          nodeRuntimeSha256: hashStableAbsoluteFile(boundaries.nodeRuntime),
          launcherBundleSha256: hashStableAbsoluteFile(boundaries.launcherFile, 1024 * 1024),
          policySha256: policyTemplateSha256(),
          sandboxBinarySha256: hashStableAbsoluteFile(boundaries.sandboxBinary),
          codexBinarySha256: hashStableAbsoluteFile(boundaries.codexBinary),
          codexCodeIdentitySha256: identityAfter.codeIdentitySha256,
        };
        const snapshotPostflightMatched = snapshotAfter.revision === options.snapshotRevision
          && snapshotAfter.manifestSha256 === options.snapshotManifestSha256
          && snapshotAfter.treeSha256 === options.snapshotTreeSha256
          && snapshotAfter.sourceStateSha256 === snapshotBefore.sourceStateSha256;
        const controllerPostflightMatched = identityAfter.verified
          && postflight.controllerBundleSha256 === options.controllerBundleSha256
          && postflight.childBundleSha256 === options.childBundleSha256
          && postflight.nodeRuntimeSha256 === options.nodeRuntimeSha256
          && postflight.launcherBundleSha256 === options.launcherBundleSha256
          && postflight.policySha256 === options.policySha256
          && postflight.sandboxBinarySha256 === options.sandboxBinarySha256
          && postflight.codexBinarySha256 === options.codexBinarySha256
          && postflight.codexCodeIdentitySha256 === options.codexCodeIdentitySha256;
        observations.codexPreflight.postflightBindingsMatched = snapshotPostflightMatched
          && controllerPostflightMatched;
        if (!snapshotPostflightMatched) failures.push('snapshot-postflight-drift');
        if (!controllerPostflightMatched) failures.push('controller-postflight-drift');
      } catch {
        failures.push('snapshot-postflight-drift', 'controller-postflight-drift');
      }
    } finally {
      const cleanup = cleanupTempState(temp);
      observations.cleanup.childrenExited = childrenExited;
      observations.cleanup.tempEntriesRemoved = cleanup.tempEntriesRemoved;
      observations.cleanup.residualNonceObjects = cleanup.residualNonceObjects;
    }
  } else {
    try {
      const snapshotAfter = verifySealedSnapshot(boundaries.snapshotRoot);
      observations.snapshot.sourceDigestAfter = snapshotAfter.sourceStateSha256;
    } catch { failures.push('snapshot-postflight-drift'); }
    observations.cleanup.childrenExited = true;
  }
  const claims = buildClaims(observations);
  if (observations.codexPreflight.staticBindingsMatched) {
    if (!claims.syntheticSecretPolicyObserved) failures.push('synthetic-secret-policy-not-observed');
    if (!(observations.liveCheckout.baselineReadObserved
      && observations.liveCheckout.sandboxReadDenied)) failures.push('live-checkout-policy-not-observed');
    if (!claims.snapshotIntegrityObserved) failures.push('snapshot-integrity-not-observed');
    if (!claims.networkPolicyObserved) failures.push('network-policy-not-observed');
    if (!claims.processInfoPolicyObserved) failures.push('process-info-policy-not-observed');
    if (!claims.boundedCleanupObserved) failures.push('bounded-cleanup-not-observed');
  }
  const uniqueFailures = [...new Set(failures)];
  const passed = uniqueFailures.length === 0 && claims.seatbeltPolicyObserved;
  const report = {
    schemaVersion: 2,
    reportType: 'codex-external-controller-seatbelt-sentinel',
    contract: { ...SEATBELT_SENTINEL_CONTRACT },
    bindings,
    execution: {
      origin: 'project-plugin-installed-copy-unverified',
      platform: process.platform,
      architecture: process.arch,
      sandboxMechanism: 'seatbelt-direct',
      sandboxCommandObserved,
      realCodexAgentSpawns: 0,
      modelInvocationRequested: false,
      credentialMaterialRequested: false,
      candidateGenerated: false,
      automaticLedgerWrites: false,
      retryCount: 0,
    },
    observations,
    claims,
    result: {
      status: passed ? 'passed-subset' : 'rejected',
      runtimeSubsetExecutionObserved: sandboxCommandObserved,
      failures: uniqueFailures,
    },
  };
  const reportSha256 = writeReport(boundaries, report);
  return Object.freeze({ report, reportSha256, exitCode: passed ? 0 : 2 });
};
