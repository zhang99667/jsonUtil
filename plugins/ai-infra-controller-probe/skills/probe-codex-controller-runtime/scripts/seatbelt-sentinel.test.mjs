import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  SEALED_SNAPSHOT_LIMITS,
  SEALED_SNAPSHOT_MANIFEST,
  collectCodexPreflightExpectations,
  collectSeatbeltSentinelStaticExpectations,
  hashSealedSnapshotPayload,
  parseSeatbeltSentinelArgs,
  reproduceWorktreeRevision,
  runSeatbeltSentinel,
  verifySealedSnapshot,
} from './seatbelt-sentinel.mjs';

const hash = value => createHash('sha256').update(value).digest('hex');
const digest = character => character.repeat(64);
const exactKeys = (value, keys) => assert.deepEqual(Object.keys(value), keys);
const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const snapshotState = (root) => {
  const records = [];
  const visit = (absolute, relative = '') => {
    const stat = fs.lstatSync(absolute, { bigint: true });
    records.push({ path: relative, mode: String(stat.mode), dev: String(stat.dev),
      ino: String(stat.ino), nlink: String(stat.nlink), uid: String(stat.uid),
      gid: String(stat.gid), size: String(stat.size), mtimeNs: String(stat.mtimeNs),
      ctimeNs: String(stat.ctimeNs), sha256: stat.isFile() ? hash(fs.readFileSync(absolute)) : null });
    if (stat.isDirectory()) {
      for (const name of fs.readdirSync(absolute).sort()) {
        visit(path.join(absolute, name), relative ? `${relative}/${name}` : name);
      }
    }
  };
  visit(root);
  return records;
};

const createFixture = ({ ledgerCopies = true } = {}) => {
  const root = fs.realpathSync(fs.mkdtempSync(path.join('/private/tmp', 'seatbelt-test-')));
  const files = [];
  const directories = [root];
  const makeDirectory = (target, mode = 0o700) => {
    fs.mkdirSync(target, { mode });
    directories.push(target);
    return target;
  };
  const writeFile = (target, bytes, mode = 0o600) => {
    fs.writeFileSync(target, bytes, { flag: 'wx', mode });
    files.push(target);
    return target;
  };
  const live = makeDirectory(path.join(root, 'live'));
  makeDirectory(path.join(live, '.git'));
  writeFile(path.join(live, 'AGENTS.md'), Buffer.from('# Synthetic checkout\n'));
  const snapshot = makeDirectory(path.join(root, 'snapshot'));
  const payloads = new Map([['AGENTS.md', Buffer.from('# Synthetic checkout\n')]]);
  let evals;
  let governance;
  if (ledgerCopies) {
    evals = makeDirectory(path.join(snapshot, 'evals'));
    governance = makeDirectory(path.join(evals, 'ai-governance'));
    payloads.set('evals/ai-governance/outcomes.jsonl', Buffer.from('{"synthetic":true}\n'));
    payloads.set('evals/ai-governance/trial-receipts.jsonl', Buffer.from('{"synthetic":true}\n'));
  }
  const entries = [...payloads].map(([entryPath, bytes]) => ({
    path: entryPath,
    kind: 'file',
    sourceClass: 'tracked',
    revisionIncluded: !entryPath.endsWith('outcomes.jsonl') && !entryPath.endsWith('trial-receipts.jsonl'),
    executableBits: 0,
    byteLength: bytes.length,
    sha256: hash(bytes),
    sealedMode: 0o400,
  })).sort((left, right) => left.path.localeCompare(right.path));
  const head = 'a'.repeat(40);
  const revision = reproduceWorktreeRevision({ entries: entries.map(entry => ({
    ...entry, bytes: payloads.get(entry.path),
  })) });
  const manifest = {
    schemaVersion: 1,
    artifactType: 'jsonutils-evolution-sealed-worktree',
    manifestVersion: '2.0.0',
    dataClass: 'repository-source-unreviewed',
    source: {
      headOid: { algorithm: 'sha1', value: head },
      fixtureRevision: revision,
      revisionProfile: 'jsonutils-evolution-source-state-v2',
      inventoryProfile: 'git-index-plus-unignored-untracked-v1',
      excludedFromRevision: [
        'evals/ai-governance/outcomes.jsonl',
        'evals/ai-governance/trial-receipts.jsonl',
      ],
    },
    environmentBinding: { sha256: digest('b'), status: 'caller-bound-unverified' },
    entries,
    bounds: {
      entryCount: entries.length,
      fileCount: entries.length,
      trackedEntries: entries.length,
      untrackedEntries: 0,
      totalBytes: entries.reduce((sum, entry) => sum + entry.byteLength, 0),
      maxFiles: SEALED_SNAPSHOT_LIMITS.maxFiles,
      maxFileBytes: SEALED_SNAPSHOT_LIMITS.maxFileBytes,
      maxTotalBytes: SEALED_SNAPSHOT_LIMITS.maxTotalBytes,
    },
    seal: { digestProfile: 'jsonutils-evolution-sealed-worktree/v1', snapshotSha256: '' },
    claims: {
      evidenceScope: 'component-only', sourceIdentityVerified: false,
      immutableMountVerified: false, externalHostVerified: false, environmentVerified: false,
      runtimeIsolationVerified: false, currentTaskRegistryVerified: false, outcomeEligible: false,
    },
  };
  manifest.seal.snapshotSha256 = hashSealedSnapshotPayload(manifest);
  for (const [entryPath, bytes] of payloads) {
    writeFile(path.join(snapshot, ...entryPath.split('/')), bytes, 0o400);
  }
  const manifestPath = writeFile(path.join(snapshot, SEALED_SNAPSHOT_MANIFEST),
    Buffer.from(JSON.stringify(manifest)), 0o400);
  for (const directory of [governance, evals, snapshot].filter(Boolean)) {
    fs.chmodSync(directory, 0o500);
  }
  const output = path.join(root, 'report.json');
  files.push(output);
  const cleanup = () => {
    for (const directory of directories) {
      try { fs.chmodSync(directory, 0o700); } catch { /* 仅清理精确测试夹具 */ }
    }
    for (const file of [...files].reverse()) {
      try { fs.unlinkSync(file); } catch (error) { if (error.code !== 'ENOENT') throw error; }
    }
    for (const directory of [...directories].reverse()) {
      if (fs.existsSync(directory) && fs.readdirSync(directory).length === 0) fs.rmdirSync(directory);
    }
  };
  return { root, live, snapshot, output, manifestPath, manifest, files, directories,
    trackFile: file => files.push(file), trackDirectory: directory => directories.push(directory), cleanup };
};

const baseArgs = ({ fixture, expected, output = fixture.output }) => {
  const snapshot = verifySealedSnapshot(fixture.snapshot);
  const staticExpected = collectSeatbeltSentinelStaticExpectations();
  return [
    '--snapshot', fixture.snapshot,
    '--live-checkout', fixture.live,
    '--snapshot-revision', snapshot.revision,
    '--snapshot-manifest-sha256', snapshot.manifestSha256,
    '--snapshot-tree-sha256', snapshot.treeSha256,
    '--controller-bundle-sha256', expected.controllerBundleSha256
      ?? staticExpected.controllerBundleSha256,
    '--child-bundle-sha256', expected.childBundleSha256 ?? staticExpected.childBundleSha256,
    '--node-runtime-sha256', expected.nodeRuntimeSha256 ?? staticExpected.nodeRuntimeSha256,
    '--launcher-bundle-sha256', expected.launcherBundleSha256
      ?? staticExpected.launcherBundleSha256,
    '--policy-sha256', expected.policySha256 ?? staticExpected.policySha256,
    '--trial-nonce-sha256', digest('c'),
    '--sandbox-binary-sha256', hash(fs.readFileSync('/usr/bin/sandbox-exec')),
    '--codex-binary', expected.codexBinary,
    '--codex-binary-sha256', expected.codexBinarySha256,
    '--codex-code-identity-sha256', expected.codexCodeIdentitySha256,
    '--codex-version', expected.codexVersion,
    '--codex-sandbox-help-sha256', expected.codexSandboxHelpSha256,
    '--output', output,
  ];
};

const codexCandidate = () => [
  '/Applications/ChatGPT.app/Contents/Resources/codex',
  '/Applications/Codex.app/Contents/Resources/codex',
].find(candidate => {
  try { return fs.realpathSync(candidate) === candidate && fs.statSync(candidate).isFile(); }
  catch { return false; }
});

test('seatbelt sentinel 参数拒绝未知、重复、相对路径与非法 binding', () => {
  const tempBefore = fs.readdirSync('/private/tmp')
    .filter(name => name.startsWith('codex-seatbelt-sentinel-')).sort();
  const values = Object.fromEntries([
    ['--snapshot', '/private/tmp/snapshot'], ['--live-checkout', '/private/tmp/live'],
    ['--snapshot-revision', `worktree-${digest('a')}`],
    ['--snapshot-manifest-sha256', digest('b')], ['--snapshot-tree-sha256', digest('c')],
    ['--controller-bundle-sha256', digest('2')], ['--child-bundle-sha256', digest('5')],
    ['--node-runtime-sha256', digest('6')], ['--launcher-bundle-sha256', digest('3')],
    ['--policy-sha256', digest('4')],
    ['--trial-nonce-sha256', digest('d')], ['--sandbox-binary-sha256', digest('e')],
    ['--codex-binary', '/private/tmp/codex'], ['--codex-binary-sha256', digest('f')],
    ['--codex-code-identity-sha256', digest('7')],
    ['--codex-version', 'codex-cli test'], ['--codex-sandbox-help-sha256', digest('1')],
    ['--output', '/private/tmp/report.json'],
  ]);
  const args = Object.entries(values).flat();
  assert.equal(parseSeatbeltSentinelArgs(args).codexVersion, 'codex-cli test');
  assert.throws(() => parseSeatbeltSentinelArgs([...args, '--unknown', 'x']), /argument-unsupported/);
  assert.throws(() => parseSeatbeltSentinelArgs([...args, '--output', '/private/tmp/x']), /argument-duplicate/);
  const relative = [...args];
  relative[relative.indexOf('--snapshot') + 1] = 'snapshot';
  assert.throws(() => parseSeatbeltSentinelArgs(relative), /argument-path-invalid/);
  const invalidDigest = [...args];
  invalidDigest[invalidDigest.indexOf('--trial-nonce-sha256') + 1] = 'not-a-digest';
  assert.throws(() => parseSeatbeltSentinelArgs(invalidDigest), /argument-digest-invalid/);
  for (const injected of ['/private/tmp/bad"path', "/private/tmp/bad'path",
    '/private/tmp/bad\\path', '/private/tmp/bad\npath', '/private/tmp/bad\x7fpath']) {
    const unsafe = [...args];
    unsafe[unsafe.indexOf('--snapshot') + 1] = injected;
    assert.throws(() => parseSeatbeltSentinelArgs(unsafe), /argument-path-invalid/);
  }
  assert.deepEqual(fs.readdirSync('/private/tmp')
    .filter(name => name.startsWith('codex-seatbelt-sentinel-')).sort(), tempBefore);
});

test('sealed snapshot 接受只读 ledger 副本并拒绝 revision 漂移与超限声明', () => {
  const fixture = createFixture();
  try {
    const verified = verifySealedSnapshot(fixture.snapshot);
    assert.equal(verified.ledgerCopiesPresent, true);
    fs.chmodSync(fixture.snapshot, 0o700);
    fs.chmodSync(fixture.manifestPath, 0o600);
    fixture.manifest.source.fixtureRevision = `worktree-${digest('f')}`;
    fixture.manifest.seal.snapshotSha256 = hashSealedSnapshotPayload(fixture.manifest);
    fs.writeFileSync(fixture.manifestPath, JSON.stringify(fixture.manifest));
    fs.chmodSync(fixture.manifestPath, 0o400);
    fs.chmodSync(fixture.snapshot, 0o500);
    assert.throws(() => verifySealedSnapshot(fixture.snapshot), /snapshot-revision-drift/);
    fs.chmodSync(fixture.snapshot, 0o700);
    fs.chmodSync(fixture.manifestPath, 0o600);
    fixture.manifest.entries[0].byteLength = SEALED_SNAPSHOT_LIMITS.maxFileBytes + 1;
    fixture.manifest.seal.snapshotSha256 = hashSealedSnapshotPayload(fixture.manifest);
    fs.writeFileSync(fixture.manifestPath, JSON.stringify(fixture.manifest));
    fs.chmodSync(fixture.manifestPath, 0o400);
    fs.chmodSync(fixture.snapshot, 0o500);
    assert.throws(() => verifySealedSnapshot(fixture.snapshot), /snapshot-file-entry-invalid/);
  } finally { fixture.cleanup(); }
  const withoutLedger = createFixture({ ledgerCopies: false });
  try {
    const verified = verifySealedSnapshot(withoutLedger.snapshot);
    assert.equal(verified.ledgerCopiesPresent, false);
    assert.match(verified.sourceStateSha256, /^[0-9a-f]{64}$/);
  } finally { withoutLedger.cleanup(); }
});

test('sealed snapshot 拒绝 .git、symlink、hardlink 与特殊文件', () => {
  const cases = [
    ['git', (fixture) => {
      const target = path.join(fixture.snapshot, '.git');
      fs.mkdirSync(target); fixture.trackDirectory(target);
    }, /snapshot-git-rejected|snapshot-path-invalid/],
    ['symlink', (fixture) => {
      const target = path.join(fixture.snapshot, 'unexpected-link');
      fs.symlinkSync('/dev/null', target); fixture.trackFile(target);
    }, /snapshot-symlink-rejected/],
    ['hardlink', (fixture) => {
      const target = path.join(fixture.snapshot, 'unexpected-hardlink');
      fs.linkSync(path.join(fixture.snapshot, 'AGENTS.md'), target); fixture.trackFile(target);
    }, /snapshot-hardlink-rejected/],
    ['fifo', (fixture) => {
      const target = path.join(fixture.snapshot, 'unexpected-fifo');
      const created = spawnSync('/usr/bin/mkfifo', [target], { stdio: 'ignore' });
      assert.equal(created.status, 0); fixture.trackFile(target);
    }, /snapshot-special-file-rejected/],
  ];
  for (const [label, mutate, expected] of cases) {
    const fixture = createFixture();
    try {
      fs.chmodSync(fixture.snapshot, 0o700);
      mutate(fixture);
      fs.chmodSync(fixture.snapshot, 0o500);
      assert.throws(() => verifySealedSnapshot(fixture.snapshot), expected, label);
    } finally { fixture.cleanup(); }
  }
});

test('helper 仅把精确 EXIT_DENIED 与成功 baseline 组合解释为 Seatbelt deny',
  { skip: process.platform !== 'darwin' }, async () => {
  const root = fs.realpathSync(fs.mkdtempSync(path.join('/private/tmp', 'seatbelt-deny-test-')));
  const target = path.join(root, 'target');
  const child = path.join(scriptDirectory, 'seatbelt-sentinel-child.mjs');
  try {
    fs.writeFileSync(target, 'readable', { mode: 0o600 });
    const expected = hash('readable');
    const baseline = spawnSync(process.execPath, [child, 'read-file', target, expected], {
      stdio: 'ignore', timeout: 2_000,
    });
    const denied = spawnSync('/usr/bin/sandbox-exec', [
      '-p', `(version 1)\n(allow default)\n(deny file-read* (literal "${target}"))`,
      process.execPath, child, 'read-file', target, expected,
    ], { stdio: 'ignore', timeout: 2_000 });
    const postBaseline = spawnSync(process.execPath, [child, 'read-file', target, expected], {
      stdio: 'ignore', timeout: 2_000,
    });
    assert.equal(baseline.status, 0);
    assert.equal(denied.status, 73);
    assert.equal(postBaseline.status, 0);
    assert.equal(baseline.status === 0 && denied.status === 73 && postBaseline.status === 0, true);

    fs.chmodSync(target, 0o000);
    const dacFailure = spawnSync('/usr/bin/sandbox-exec', [
      '-p', '(version 1)\n(allow default)', process.execPath, child,
      'read-file', target, expected,
    ], { stdio: 'ignore', timeout: 2_000 });
    assert.equal(dacFailure.status, 74);
    assert.notEqual(dacFailure.status, 73);

    fs.chmodSync(target, 0o600);
    const invalidProfile = spawnSync('/usr/bin/sandbox-exec', [
      '-p', '(version 1)\n(deny invalid-operation*)', process.execPath, child,
      'read-file', target, expected,
    ], { stdio: 'ignore', timeout: 2_000 });
    assert.notEqual(invalidProfile.status, 73);

    const missingProcess = spawnSync(process.execPath,
      [child, 'inspect-process', '999999999', String(process.getuid())], {
        stdio: 'ignore', timeout: 2_000,
      });
    assert.equal(missingProcess.status, 74);

    const server = net.createServer();
    await new Promise((resolve, reject) => {
      server.once('error', reject);
      server.listen(0, '127.0.0.1', resolve);
    });
    const closedPort = String(server.address().port);
    await new Promise(resolve => server.close(resolve));
    const ordinaryNetworkFailure = spawnSync(process.execPath,
      [child, 'connect-loopback', closedPort], { stdio: 'ignore', timeout: 2_000 });
    assert.equal(ordinaryNetworkFailure.status, 74);
  } finally {
    try { fs.chmodSync(target, 0o600); } catch { /* 仅清理精确测试文件 */ }
    try { fs.unlinkSync(target); } catch (error) { if (error.code !== 'ENOENT') throw error; }
    fs.rmdirSync(root);
  }
});

test('Seatbelt Darwin 集成输出闭字段 0600 passed-subset 且不泄漏路径正文',
  { skip: process.platform !== 'darwin' }, async (t) => {
    const codexBinary = codexCandidate();
    if (!codexBinary) { t.skip('Codex CLI unavailable'); return; }
    const fixture = createFixture();
    try {
      const sourceBefore = verifySealedSnapshot(fixture.snapshot).sourceStateSha256;
      const sourceTreeBefore = snapshotState(fixture.snapshot);
      const preflight = await collectCodexPreflightExpectations(codexBinary);
      const staticExpected = collectSeatbeltSentinelStaticExpectations();
      const expected = { codexBinary, ...preflight, ...staticExpected };
      const launcher = path.join(scriptDirectory, 'run-seatbelt-sentinel.mjs');
      const cli = spawnSync(process.execPath,
        [launcher, ...baseArgs({ fixture, expected })], {
          encoding: 'utf8', timeout: 15_000, maxBuffer: 1024 * 1024,
          env: { PATH: '/usr/bin:/bin:/usr/sbin:/sbin', LANG: 'C', LC_ALL: 'C' },
        });
      const summary = JSON.parse(cli.stdout);
      const result = { exitCode: cli.status, report: JSON.parse(fs.readFileSync(fixture.output)),
        reportSha256: summary.reportSha256 };
      assert.equal(result.exitCode, 0, JSON.stringify({ result: result.report.result,
        observations: result.report.observations }));
      assert.equal(cli.stderr, '');
      assert.equal(summary.schemaVersion, 2);
      assert.equal(summary.reportType, 'codex-seatbelt-sentinel-summary');
      assert.equal(result.report.result.status, 'passed-subset');
      assert.equal(result.report.schemaVersion, 2);
      assert.equal(result.report.contract.version, '2.2.0');
      assert.equal(result.report.reportType, 'codex-external-controller-seatbelt-sentinel');
      assert.equal(result.report.result.runtimeSubsetExecutionObserved, true);
      exactKeys(result.report, ['schemaVersion', 'reportType', 'contract', 'bindings', 'execution',
        'observations', 'claims', 'result']);
      exactKeys(result.report.contract, ['id', 'version', 'evidenceScope', 'coverage', 'producer']);
      exactKeys(result.report.bindings, ['snapshotRevision', 'snapshotManifestSha256',
        'snapshotTreeSha256', 'controllerBundleSha256', 'childBundleSha256',
        'nodeRuntimeSha256', 'launcherBundleSha256', 'policySha256', 'trialNonceSha256',
        'sandboxBinarySha256', 'codexBinarySha256', 'codexCodeIdentitySha256',
        'codexVersion', 'codexSandboxHelpSha256']);
      exactKeys(result.report.execution, ['origin', 'platform', 'architecture', 'sandboxMechanism',
        'sandboxCommandObserved', 'realCodexAgentSpawns', 'modelInvocationRequested',
        'credentialMaterialRequested', 'candidateGenerated', 'automaticLedgerWrites', 'retryCount']);
      exactKeys(result.report.observations, ['codexPreflight', 'syntheticSecret', 'liveCheckout',
        'snapshot', 'network', 'processInfo', 'cleanup']);
      exactKeys(result.report.observations.codexPreflight, ['staticBindingsMatched',
        'codeIdentityMatched', 'versionMatched', 'sandboxHelpMatched', 'seatbeltProfileObserved',
        'postflightBindingsMatched']);
      exactKeys(result.report.observations.snapshot, ['sourceMutationAttempted',
        'sourceDigestBefore', 'sourceDigestAfter', 'manifestReadObserved', 'manifestReadSha256',
        'ledgerCopiesPresent', 'disposableMirrorBaselineChmodObserved',
        'disposableMirrorBaselineWriteObserved', 'disposableMirrorChmodDenied',
        'disposableMirrorWriteDenied', 'disposableMirrorDigestBefore',
        'disposableMirrorDigestAfter']);
      exactKeys(result.report.claims, ['seatbeltPolicyObserved', 'snapshotIntegrityObserved',
        'syntheticSecretPolicyObserved', 'networkPolicyObserved', 'processInfoPolicyObserved',
        'boundedCleanupObserved', 'secretIsolationVerified', 'immutableMountVerified',
        'pidNamespaceVerified', 'userNamespaceVerified', 'controllerIsolationVerified',
        'signerIsolationVerified', 'trustedSigners', 'modelInvocationAbsenceVerified',
        'currentTaskRegistryVerified', 'topologyComplete', 'outcomeEligible',
        'confirmedCoverageEligible']);
      exactKeys(result.report.result, ['status', 'runtimeSubsetExecutionObserved', 'failures']);
      assert.equal(result.report.claims.seatbeltPolicyObserved, true);
      assert.equal(result.report.claims.snapshotIntegrityObserved, true);
      assert.equal(result.report.claims.immutableMountVerified, false);
      assert.equal(result.report.claims.controllerIsolationVerified, false);
      assert.equal(result.report.claims.modelInvocationAbsenceVerified, false);
      assert.equal(result.report.observations.snapshot.ledgerCopiesPresent, true);
      assert.equal(result.report.observations.snapshot.sourceMutationAttempted, false);
      assert.equal(result.report.observations.snapshot.sourceDigestBefore, sourceBefore);
      assert.equal(result.report.observations.snapshot.sourceDigestAfter, sourceBefore);
      assert.equal(verifySealedSnapshot(fixture.snapshot).sourceStateSha256, sourceBefore);
      assert.deepEqual(snapshotState(fixture.snapshot), sourceTreeBefore);
      assert.equal(result.report.bindings.controllerBundleSha256,
        staticExpected.controllerBundleSha256);
      assert.equal(result.report.bindings.launcherBundleSha256,
        staticExpected.launcherBundleSha256);
      assert.equal(result.report.bindings.childBundleSha256, staticExpected.childBundleSha256);
      assert.equal(result.report.bindings.nodeRuntimeSha256, staticExpected.nodeRuntimeSha256);
      assert.equal(result.report.bindings.codexCodeIdentitySha256,
        preflight.codexCodeIdentitySha256);
      assert.equal(result.report.bindings.policySha256, staticExpected.policySha256);
      assert.deepEqual(result.report.result.failures, []);
      assert.equal(fs.statSync(fixture.output).mode & 0o777, 0o600);
      assert.deepEqual(JSON.parse(fs.readFileSync(fixture.output, 'utf8')), result.report);
      assert.equal(result.reportSha256, hash(fs.readFileSync(fixture.output)));
      const serialized = JSON.stringify(result.report);
      for (const forbidden of [fixture.root, fixture.live, fixture.snapshot,
        'Synthetic checkout', 'synthetic-only', 'owner-control']) assert.equal(serialized.includes(forbidden), false);
    } finally { fixture.cleanup(); }
  });

test('caller expected binding 不匹配在启动 Seatbelt 前输出 rejected report',
  { skip: process.platform !== 'darwin' }, async (t) => {
    const codexBinary = codexCandidate();
    if (!codexBinary) { t.skip('Codex CLI unavailable'); return; }
    const fixture = createFixture();
    try {
      const preflight = await collectCodexPreflightExpectations(codexBinary);
      const expected = { codexBinary, ...preflight, ...collectSeatbeltSentinelStaticExpectations(),
        policySha256: digest('0') };
      const tempBefore = fs.readdirSync('/private/tmp')
        .filter(name => name.startsWith('codex-seatbelt-sentinel-')).sort();
      const result = await runSeatbeltSentinel({ argv: baseArgs({ fixture, expected }), env: {} });
      assert.equal(result.exitCode, 2);
      assert.equal(result.report.result.status, 'rejected');
      assert.equal(result.report.execution.sandboxCommandObserved, false);
      assert.equal(result.report.result.failures.includes('policy-digest-mismatch'), true);
      assert.equal(result.report.result.failures.includes('static-binding-mismatch'), true);
      assert.deepEqual(fs.readdirSync('/private/tmp')
        .filter(name => name.startsWith('codex-seatbelt-sentinel-')).sort(), tempBefore);
    } finally { fixture.cleanup(); }
  });

test('恶意 Codex 路径在签名或执行前被边界拒绝且不会创建 marker', async () => {
  const fixture = createFixture();
  const malicious = path.join(fixture.root, 'malicious-codex');
  const marker = path.join(fixture.root, 'malicious-executed');
  try {
    fs.writeFileSync(malicious,
      `#!/bin/sh\n/usr/bin/touch ${JSON.stringify(marker)}\n`, { mode: 0o700 });
    fixture.trackFile(malicious);
    fixture.trackFile(marker);
    const expected = {
      codexBinary: malicious,
      codexBinarySha256: hash(fs.readFileSync(malicious)),
      codexCodeIdentitySha256: digest('a'),
      codexVersion: 'codex-cli malicious',
      codexSandboxHelpSha256: digest('b'),
    };
    await assert.rejects(() => runSeatbeltSentinel({
      argv: baseArgs({ fixture, expected }), env: {},
    }), /codex-binary-boundary-rejected/);
    assert.equal(fs.existsSync(marker), false);
    assert.equal(fs.existsSync(fixture.output), false);
  } finally { fixture.cleanup(); }
});

test('output parent 必须是当前 owner 的 canonical 0700 目录', async () => {
  const fixture = createFixture();
  const unsafeParent = path.join(fixture.root, 'unsafe-output');
  const aclParent = path.join(fixture.root, 'acl-output');
  try {
    fs.mkdirSync(unsafeParent, { mode: 0o755 });
    fixture.trackDirectory(unsafeParent);
    fs.mkdirSync(aclParent, { mode: 0o700 });
    fixture.trackDirectory(aclParent);
    const expected = {
      codexBinary: process.execPath,
      codexBinarySha256: hash(fs.readFileSync(process.execPath)),
      codexCodeIdentitySha256: digest('c'),
      codexVersion: 'codex-cli synthetic',
      codexSandboxHelpSha256: digest('d'),
    };
    await assert.rejects(() => runSeatbeltSentinel({
      argv: baseArgs({ fixture, expected, output: path.join(unsafeParent, 'report.json') }), env: {},
    }), /output-parent-security-invalid/);
    if (process.platform === 'darwin') {
      const addAcl = spawnSync('/bin/chmod', ['+a', 'everyone deny delete', aclParent], {
        stdio: 'ignore', timeout: 2_000,
      });
      assert.equal(addAcl.status, 0);
      await assert.rejects(() => runSeatbeltSentinel({
        argv: baseArgs({ fixture, expected, output: path.join(aclParent, 'report.json') }), env: {},
      }), /output-parent-acl-invalid/);
    }
  } finally {
    if (process.platform === 'darwin') spawnSync('/bin/chmod', ['-N', aclParent], { stdio: 'ignore' });
    fixture.cleanup();
  }
});

test('外部 snapshot 元数据漂移被 postflight 拒绝，sentinel 不对 source 发起 mutation',
  { skip: process.platform !== 'darwin' }, async (t) => {
    const codexBinary = codexCandidate();
    if (!codexBinary) { t.skip('Codex CLI unavailable'); return; }
    const fixture = createFixture();
    try {
      const preflight = await collectCodexPreflightExpectations(codexBinary);
      const expected = { codexBinary, ...preflight, ...collectSeatbeltSentinelStaticExpectations() };
      const run = runSeatbeltSentinel({ argv: baseArgs({ fixture, expected }), env: {} });
      await new Promise(resolve => setImmediate(resolve));
      fs.chmodSync(fixture.manifestPath, 0o600);
      fs.chmodSync(fixture.manifestPath, 0o400);
      const result = await run;
      assert.equal(result.exitCode, 2);
      assert.equal(result.report.result.failures.includes('snapshot-postflight-drift'), true);
      assert.equal(result.report.observations.snapshot.sourceMutationAttempted, false);
      assert.notEqual(result.report.observations.snapshot.sourceDigestBefore,
        result.report.observations.snapshot.sourceDigestAfter);
      assert.equal(result.report.claims.snapshotIntegrityObserved, false);
    } finally { fixture.cleanup(); }
  });

test('敏感环境与 output/live overlap 在任何执行前 fail closed', async () => {
  const fixture = createFixture();
  try {
    const expected = {
      codexBinary: process.execPath,
      codexBinarySha256: hash(fs.readFileSync(process.execPath)),
      codexCodeIdentitySha256: digest('c'),
      codexVersion: 'codex-cli synthetic',
      codexSandboxHelpSha256: digest('d'),
    };
    const args = baseArgs({ fixture, expected });
    await assert.rejects(() => runSeatbeltSentinel({ argv: args,
      env: { OPENAI_API_KEY: 'FAKE-ONLY-NOT-READ' } }), /credential-environment-rejected/);
    assert.equal(fs.existsSync(fixture.output), false);
    const overlapped = baseArgs({ fixture, expected,
      output: path.join(fixture.live, 'report.json') });
    await assert.rejects(() => runSeatbeltSentinel({ argv: overlapped, env: {} }),
      /output-boundary-rejected/);
  } finally { fixture.cleanup(); }
});

test('CLI 错误固定脱敏且不回显参数或绝对路径', () => {
  const launcher = path.join(scriptDirectory, 'run-seatbelt-sentinel.mjs');
  const marker = '/private/tmp/SHOULD-NOT-APPEAR';
  const result = spawnSync(process.execPath, [launcher, '--unknown', marker], {
    encoding: 'utf8', timeout: 2_000, maxBuffer: 8_192,
  });
  assert.equal(result.status, 1);
  assert.equal(result.stdout, '');
  assert.equal(result.stderr,
    '{"schemaVersion":2,"reportType":"codex-seatbelt-sentinel-error","error":"seatbelt-sentinel-failed"}\n');
  assert.equal(result.stderr.includes(marker), false);
});
