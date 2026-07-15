import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

import { preflightRegistrationCanarySnapshot } from './aiGovernanceRegistrationCanarySnapshotPreflight.mjs';
import { sealRegistrationCanarySnapshot } from './aiGovernanceRegistrationCanarySealedSnapshot.mjs';
import {
  buildRegistrationCanarySnapshotLaunch,
  prepareRegistrationCanarySnapshot,
} from './prepare-ai-registration-canary-snapshot.mjs';
import { prepareRegistrationCanaryProjection } from './prepare-ai-registration-canary.mjs';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const digest = value => createHash('sha256').update(value).digest('hex');
const projections = ['agent', 'grader', 'host'];
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
const buildBundle = (projectRoot, args) => Object.fromEntries(projections.map(projection => [
  projection,
  prepareRegistrationCanaryProjection({
    projectRoot,
    argv: [
      '--trial', args.trialId,
      '--projection', projection,
      '--run-nonce', args.runNonce,
      '--environment-sha256', args.environmentSha256,
    ],
  }),
]));

test('snapshot launch 只公开盲态 projection digest，不合并三视图正文', () => {
  const launch = buildRegistrationCanarySnapshotLaunch({
    sealed: {
      manifest: {
        manifestVersion: '1.0.0',
        dataClass: 'repository-source-unreviewed',
        bounds: { entryCount: 3, totalBytes: 42 },
      },
      snapshotSha256: 'a'.repeat(64),
      manifestFileSha256: 'b'.repeat(64),
      fixtureRevision: `worktree-${'c'.repeat(64)}`,
      environmentSha256: 'd'.repeat(64),
    },
    snapshotBundle: {
      agent: { prompt: 'agent-secret' },
      grader: { expectedOutcome: 'grader-secret', rubric: 'rubric-secret' },
      host: { treatment: 'host-secret' },
    },
    preflight: { artifactType: 'ai-registration-canary-snapshot-preflight' },
  });
  assert.equal(Object.hasOwn(launch, 'packetBundle'), false);
  assert.deepEqual(Object.keys(launch.projectionDigests), projections);
  assert.ok(Object.values(launch.projectionDigests).every(value => /^[0-9a-f]{64}$/.test(value)));
  assert.doesNotMatch(JSON.stringify(launch), /agent-secret|grader-secret|rubric-secret|host-secret/);
  assert.equal(launch.claims.modelInvocationRequested, false);
  assert.equal(launch.claims.modelInvocationAbsenceVerified, false);
  assert.equal(launch.claims.ledgerWriteRequested, false);
  assert.equal(launch.claims.ledgerWriteAbsenceVerified, false);
  assert.equal(launch.claims.descendantCleanupVerified, false);
  assert.equal(launch.claims.temporaryHomeCleanupVerified, false);
});

test('snapshot launch 后续 packet 失败时保留已封存输出，不执行不安全递归 cleanup', async () => {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), 'jsonutils-snapshot-launch-cleanup-'));
  const sourceRoot = path.join(base, 'source');
  const outputRoot = path.join(base, 'snapshot');
  fs.mkdirSync(sourceRoot);
  try {
    assert.equal(spawnSync('git', ['-C', sourceRoot, 'init', '-q']).status, 0);
    fs.writeFileSync(path.join(sourceRoot, 'README.md'), 'fixture\n');
    assert.equal(spawnSync('git', ['-C', sourceRoot, 'add', '.']).status, 0);
    assert.equal(spawnSync('git', [
      '-C', sourceRoot,
      '-c', 'user.name=fixture',
      '-c', 'user.email=fixture@example.com',
      'commit', '-q', '--no-gpg-sign', '-m', 'fixture',
    ]).status, 0);
    await assert.rejects(() => prepareRegistrationCanarySnapshot({
      sourceRoot,
      argv: [
        '--output', outputRoot,
        '--trial', 'mcp-registration-p1-baseline',
        '--run-nonce', digest('cleanup-run'),
        '--environment-sha256', digest('cleanup-environment'),
      ],
    }));
    assert.equal(fs.existsSync(outputRoot), true);
    assert.equal(fs.statSync(outputRoot).mode & 0o777, 0o500);
  } finally { makeWritableAndRemove(base); }
});

test('真实 sealed snapshot 内 MCP scorecard preflight 绑定同一 packet 且不升级行为声明', { timeout: 180_000 }, async () => {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), 'jsonutils-real-snapshot-preflight-'));
  const snapshotRoot = path.join(base, 'snapshot');
  const args = {
    trialId: 'mcp-registration-p1-baseline',
    runNonce: digest('snapshot-preflight-run'),
    environmentSha256: digest('snapshot-preflight-environment-unverified'),
  };
  try {
    const sealed = sealRegistrationCanarySnapshot({
      sourceRoot: rootDir, outputRoot: snapshotRoot, environmentSha256: args.environmentSha256,
    });
    const liveBundle = buildBundle(rootDir, args);
    const snapshotBundle = buildBundle(snapshotRoot, args);
    assert.deepEqual(snapshotBundle, liveBundle);

    const preflight = await preflightRegistrationCanarySnapshot({
      snapshotRoot,
      packetBundle: snapshotBundle,
      expectedSnapshotSha256: sealed.snapshotSha256,
    });
    assert.equal(preflight.artifactType, 'ai-registration-canary-snapshot-preflight');
    assert.equal(preflight.bindings.fixtureRevision, sealed.fixtureRevision);
    assert.equal(preflight.observations.scorecardObserved, true);
    assert.equal(preflight.observations.ledgerEndpointsStableBeforeAfter, true);
    assert.equal(preflight.observations.ledgerGitPrefixVerified, false);
    assert.equal(preflight.claims.evidenceScope, 'component-only');
    assert.equal(preflight.claims.currentTaskRegistryVerified, false);
    assert.equal(preflight.claims.environmentVerified, false);
    assert.equal(preflight.claims.outcomeEligible, false);
    assert.equal(preflight.claims.modelInvocationRequested, false);
    assert.equal(preflight.claims.modelInvocationAbsenceVerified, false);
    assert.equal(preflight.claims.ledgerWriteRequested, false);
    assert.equal(preflight.claims.ledgerWriteAbsenceVerified, false);
    assert.equal(preflight.claims.descendantCleanupVerified, false);
    assert.equal(preflight.claims.temporaryHomeCleanupVerified, false);
    assert.equal(typeof preflight.mcp.stderr.nonEmpty, 'boolean');
    assert.deepEqual(preflight.mcp.runtimeHome, { stableObserved: true, retained: true, cleanupVerified: false });

    await assert.rejects(() => preflightRegistrationCanarySnapshot({
      snapshotRoot,
      packetBundle: snapshotBundle,
      expectedSnapshotSha256: digest('wrong-snapshot'),
    }), /expected snapshot digest/);
    const drifted = buildBundle(snapshotRoot, {
      ...args,
      environmentSha256: digest('other-environment'),
    });
    await assert.rejects(() => preflightRegistrationCanarySnapshot({
      snapshotRoot,
      packetBundle: drifted,
      expectedSnapshotSha256: sealed.snapshotSha256,
    }), /packet 与 fixture\/environment\/ledger bindings 不匹配/);
  } finally { makeWritableAndRemove(base); }
});
