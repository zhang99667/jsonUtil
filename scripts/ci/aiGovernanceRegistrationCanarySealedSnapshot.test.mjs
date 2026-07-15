import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';

import {
  EVOLUTION_WORKTREE_REVISION_PROFILE,
  EVOLUTION_SEALED_WORKTREE_MANIFEST,
  hashEvolutionSealedWorktreePayload,
  hashEvolutionWorktreeEntries,
  verifyEvolutionSealedWorktreeSnapshot,
} from './aiGovernanceEvolutionSealedWorktreeManifest.mjs';
import { resolveEvolutionWorktreeRevision } from './aiGovernanceEvolutionWorktreeRevision.mjs';
import { readExactBoundedDescriptor } from './aiGovernanceEvolutionSnapshotPrimitives.mjs';
import { sealRegistrationCanarySnapshot } from './aiGovernanceRegistrationCanarySealedSnapshot.mjs';
import { verifySealedSnapshot as verifyProjectPluginSealedSnapshot } from '../../plugins/ai-infra-controller-probe/skills/probe-codex-controller-runtime/scripts/seatbelt-sentinel.mjs';

const environmentSha256 = 'a'.repeat(64);
const git = (root, args) => spawnSync('git', ['-C', root, ...args], { encoding: 'utf8' });
const write = (root, file, content) => {
  const target = path.join(root, file);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content);
};
const makeWritableAndRemove = (target) => {
  if (!fs.existsSync(target)) return;
  const visit = (current) => {
    const stat = fs.lstatSync(current);
    if (stat.isDirectory() && !stat.isSymbolicLink()) {
      fs.chmodSync(current, 0o700);
      fs.readdirSync(current).forEach(name => visit(path.join(current, name)));
    } else if (!stat.isSymbolicLink()) fs.chmodSync(current, 0o600);
  };
  visit(target);
  fs.rmSync(target, { recursive: true, force: true });
};

const createFixture = () => {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), 'jsonutils-sealed-snapshot-'));
  const source = path.join(base, 'source');
  const snapshot = path.join(base, 'snapshot');
  fs.mkdirSync(source);
  assert.equal(git(source, ['init', '-q']).status, 0);
  write(source, 'normal.txt', 'normal\n');
  write(source, 'bin/run.sh', '#!/bin/sh\nexit 0\n');
  fs.chmodSync(path.join(source, 'bin/run.sh'), 0o700);
  write(source, 'frontend/.env.example', 'API_KEY=\n');
  write(source, 'evals/ai-governance/outcomes.jsonl', '{"schemaVersion":1}\n');
  write(source, 'evals/ai-governance/trial-receipts.jsonl', '{"schemaVersion":1}\n');
  assert.equal(git(source, ['add', '.']).status, 0);
  assert.equal(git(source, [
    '-c', 'user.name=fixture', '-c', 'user.email=fixture@example.com',
    'commit', '-q', '--no-gpg-sign', '-m', 'fixture',
  ]).status, 0);
  write(source, 'untracked.txt', 'untracked\n');
  return { base, source, snapshot };
};

test('共享 source-state v2 hash 锁定 profile 与 path/mode/file/symlink/deleted 字节语义', () => {
  const revision = hashEvolutionWorktreeEntries({
    entries: [
      { path: 'z.txt', kind: 'deleted', revisionIncluded: true },
      { path: 'a.txt', kind: 'file', revisionIncluded: true, executableBits: 0o100, bytes: Buffer.from('one') },
      { path: 'ignored-ledger', kind: 'file', revisionIncluded: false, executableBits: 0, bytes: Buffer.from('ignored') },
      { path: 'link', kind: 'symlink', revisionIncluded: true, executableBits: 0, target: 'a.txt' },
    ],
  });
  assert.equal(revision, 'worktree-0466722e552e5615439f0e9d3558b4a495fa8b9e0122fe6cc86bd873a37201c2');
});

test('bounded descriptor 不会在 stat 后吞入增长内容，并拒绝读取期缩短', () => {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), 'jsonutils-bounded-descriptor-'));
  const file = path.join(base, 'value.bin');
  fs.writeFileSync(file, 'abc');
  const descriptor = fs.openSync(file, 'r');
  try {
    assert.throws(() => readExactBoundedDescriptor(descriptor, 2, 'fixture'), /增长/);
    assert.throws(() => readExactBoundedDescriptor(descriptor, 4, 'fixture'), /缩短/);
  } finally {
    fs.closeSync(descriptor);
    fs.rmSync(base, { recursive: true, force: true });
  }
});

test('sealed snapshot 从实际字节重建 worktree revision，并保留精确 executable bits', () => {
  const fixture = createFixture();
  try {
    const liveRevision = resolveEvolutionWorktreeRevision(fixture.source);
    const sealed = sealRegistrationCanarySnapshot({
      sourceRoot: fixture.source, outputRoot: fixture.snapshot, environmentSha256,
    });
    const pluginVerification = verifyProjectPluginSealedSnapshot(fs.realpathSync(fixture.snapshot));
    assert.equal(sealed.fixtureRevision, liveRevision);
    assert.equal(pluginVerification.revision, liveRevision);
    assert.equal(pluginVerification.manifestSha256, sealed.manifestFileSha256);
    assert.equal(pluginVerification.treeSha256, sealed.snapshotSha256);
    assert.equal(resolveEvolutionWorktreeRevision(fixture.snapshot), liveRevision);
    assert.equal(sealed.manifest.manifestVersion, '2.0.0');
    assert.equal(sealed.manifest.source.revisionProfile, EVOLUTION_WORKTREE_REVISION_PROFILE);
    assert.equal(sealed.manifest.dataClass, 'repository-source-unreviewed');
    assert.equal(sealed.manifest.entries.find(entry => entry.path === 'bin/run.sh').executableBits, 0o100);
    assert.equal(fs.statSync(path.join(fixture.snapshot, 'bin/run.sh')).mode & 0o777, 0o500);
    assert.equal(fs.statSync(path.join(fixture.snapshot, 'normal.txt')).mode & 0o777, 0o400);
    assert.equal(sealed.observations.ledgerGitPrefixVerified, false);
    assert.equal(sealed.claims.immutableMountVerified, false);
    assert.equal(sealed.claims.outcomeEligible, false);
  } finally { makeWritableAndRemove(fixture.base); }
});

test('sealed snapshot verifier 拒绝内容、额外文件和 revisionIncluded 漂移', () => {
  const fixture = createFixture();
  try {
    sealRegistrationCanarySnapshot({ sourceRoot: fixture.source, outputRoot: fixture.snapshot, environmentSha256 });
    const normal = path.join(fixture.snapshot, 'normal.txt');
    fs.chmodSync(normal, 0o600);
    fs.writeFileSync(normal, 'changed\n');
    fs.chmodSync(normal, 0o400);
    assert.throws(() => verifyEvolutionSealedWorktreeSnapshot(fixture.snapshot), /摘要、大小或 mode 漂移/);
    makeWritableAndRemove(fixture.snapshot);

    sealRegistrationCanarySnapshot({ sourceRoot: fixture.source, outputRoot: fixture.snapshot, environmentSha256 });
    fs.chmodSync(fixture.snapshot, 0o700);
    fs.writeFileSync(path.join(fixture.snapshot, 'extra.txt'), 'extra');
    fs.chmodSync(path.join(fixture.snapshot, 'extra.txt'), 0o400);
    fs.chmodSync(fixture.snapshot, 0o500);
    assert.throws(() => verifyEvolutionSealedWorktreeSnapshot(fixture.snapshot), /exact set/);
    makeWritableAndRemove(fixture.snapshot);

    sealRegistrationCanarySnapshot({ sourceRoot: fixture.source, outputRoot: fixture.snapshot, environmentSha256 });
    const manifestPath = path.join(fixture.snapshot, EVOLUTION_SEALED_WORKTREE_MANIFEST);
    fs.chmodSync(manifestPath, 0o600);
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    manifest.entries.find(entry => entry.path === 'normal.txt').revisionIncluded = false;
    manifest.seal.snapshotSha256 = hashEvolutionSealedWorktreePayload(manifest);
    fs.writeFileSync(manifestPath, JSON.stringify(manifest));
    fs.chmodSync(manifestPath, 0o400);
    assert.throws(() => verifyEvolutionSealedWorktreeSnapshot(fixture.snapshot), /entry 非法/);
  } finally { makeWritableAndRemove(fixture.base); }
});

test('sealed snapshot producer 拒绝 checkout 内输出、symlink 与真实敏感文件', () => {
  const fixture = createFixture();
  try {
    assert.throws(() => sealRegistrationCanarySnapshot({
      sourceRoot: fixture.source,
      outputRoot: path.join(fixture.source, 'snapshot'),
      environmentSha256,
    }), /checkout 外/);

    fs.symlinkSync('normal.txt', path.join(fixture.source, 'linked.txt'));
    assert.throws(() => sealRegistrationCanarySnapshot({
      sourceRoot: fixture.source, outputRoot: fixture.snapshot, environmentSha256,
    }), /普通文件/);
    fs.unlinkSync(path.join(fixture.source, 'linked.txt'));

    write(fixture.source, '.env.local', 'API_KEY=value\n');
    assert.throws(() => sealRegistrationCanarySnapshot({
      sourceRoot: fixture.source, outputRoot: fixture.snapshot, environmentSha256,
    }), /真实 \.env 文件/);
  } finally { makeWritableAndRemove(fixture.base); }
});

test('sealed snapshot producer 拒绝未跟踪用户产物与超限 environment binding', () => {
  const fixture = createFixture();
  try {
    write(fixture.source, 'outputs/private.ndjson', '{"value":1}\n');
    assert.throws(() => sealRegistrationCanarySnapshot({
      sourceRoot: fixture.source, outputRoot: fixture.snapshot, environmentSha256,
    }), /未跟踪用户产物路径/);
    assert.throws(() => sealRegistrationCanarySnapshot({
      sourceRoot: fixture.source, outputRoot: fixture.snapshot, environmentSha256: 'not-a-digest',
    }), /64 位小写 SHA-256/);
  } finally { makeWritableAndRemove(fixture.base); }
});

test('sealed snapshot Git inventory 不受 ambient GIT_INDEX_FILE 重定向', () => {
  const fixture = createFixture();
  const previous = process.env.GIT_INDEX_FILE;
  try {
    process.env.GIT_INDEX_FILE = path.join(fixture.base, 'ambient-bogus-index');
    const liveRevision = resolveEvolutionWorktreeRevision(fixture.source);
    const sealed = sealRegistrationCanarySnapshot({
      sourceRoot: fixture.source, outputRoot: fixture.snapshot, environmentSha256,
    });
    assert.equal(sealed.fixtureRevision, liveRevision);
  } finally {
    if (previous === undefined) delete process.env.GIT_INDEX_FILE;
    else process.env.GIT_INDEX_FILE = previous;
    makeWritableAndRemove(fixture.base);
  }
});

test('sealed snapshot 内部失败采用 owner-only retention，不执行递归自动删除', () => {
  const fixture = createFixture();
  try {
    write(fixture.source, '.env.local', 'TOKEN=value\n');
    assert.throws(() => sealRegistrationCanarySnapshot({
      sourceRoot: fixture.source, outputRoot: fixture.snapshot, environmentSha256,
    }), (error) => {
      assert.equal(typeof error.retainedSnapshotPath, 'string');
      assert.equal(Object.keys(error).includes('retainedSnapshotPath'), false);
      assert.equal(fs.existsSync(error.retainedSnapshotPath), true);
      assert.equal(fs.statSync(error.retainedSnapshotPath).mode & 0o077, 0);
      return true;
    });
    assert.equal(fs.existsSync(fixture.snapshot), false);
  } finally { makeWritableAndRemove(fixture.base); }
});

test('sealed snapshot 扫描大文件私钥 marker，并在读取 payload 前拒绝超限 manifest total', () => {
  const fixture = createFixture();
  try {
    const largeSecret = Buffer.concat([
      Buffer.alloc(1024 * 1024 + 1, 0x61),
      Buffer.from(['-----BEGIN ', 'ENCRYPTED ', 'PRIVATE KEY-----'].join(''), 'ascii'),
    ]);
    write(fixture.source, 'large.txt', largeSecret);
    assert.throws(() => sealRegistrationCanarySnapshot({
      sourceRoot: fixture.source, outputRoot: fixture.snapshot, environmentSha256,
    }), /私钥正文/);
    fs.unlinkSync(path.join(fixture.source, 'large.txt'));

    sealRegistrationCanarySnapshot({ sourceRoot: fixture.source, outputRoot: fixture.snapshot, environmentSha256 });
    const manifestPath = path.join(fixture.snapshot, EVOLUTION_SEALED_WORKTREE_MANIFEST);
    fs.chmodSync(manifestPath, 0o600);
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    const capEntries = Array.from({ length: 5 }, (_, index) => ({
      path: `zz-cap-${index}.bin`,
      kind: 'file',
      sourceClass: 'untracked',
      revisionIncluded: true,
      executableBits: 0,
      byteLength: index < 4 ? 16 * 1024 * 1024 : 1,
      sha256: '0'.repeat(64),
      sealedMode: 0o400,
    }));
    manifest.entries.push(...capEntries);
    manifest.entries.sort((left, right) => left.path.localeCompare(right.path));
    manifest.bounds.entryCount = manifest.entries.length;
    manifest.bounds.fileCount += capEntries.length;
    manifest.bounds.untrackedEntries += capEntries.length;
    manifest.bounds.totalBytes = manifest.entries.reduce((sum, entry) => sum + (entry.byteLength ?? 0), 0);
    manifest.seal.snapshotSha256 = hashEvolutionSealedWorktreePayload(manifest);
    fs.writeFileSync(manifestPath, JSON.stringify(manifest));
    fs.chmodSync(manifestPath, 0o400);
    assert.throws(() => verifyEvolutionSealedWorktreeSnapshot(fixture.snapshot), /bounds 不匹配/);
  } finally { makeWritableAndRemove(fixture.base); }
});
