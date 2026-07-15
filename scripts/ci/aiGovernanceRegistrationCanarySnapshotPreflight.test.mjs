import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

import { preflightRegistrationCanarySnapshot, projectRegistrationCanarySnapshotScorecard } from './aiGovernanceRegistrationCanarySnapshotPreflight.mjs';
import {
  createRegistrationCanarySnapshotStderrObserver,
  readRegistrationCanarySnapshotMcpConfig,
  REGISTRATION_CANARY_SNAPSHOT_STDERR_MAX_BYTES,
} from './aiGovernanceRegistrationCanarySnapshotContract.mjs';
import {
  buildRegistrationCanarySnapshotBundle,
  buildRegistrationCanarySnapshotScorecardCall,
  digestRegistrationCanarySnapshotFixture,
  REGISTRATION_CANARY_SNAPSHOT_PROJECTIONS,
  removeRegistrationCanarySnapshotFixture,
} from './aiGovernanceRegistrationCanarySnapshotPreflightTestFixtures.mjs';
import { sealRegistrationCanarySnapshot } from './aiGovernanceRegistrationCanarySealedSnapshot.mjs';
import {
  buildRegistrationCanarySnapshotLaunch,
  prepareRegistrationCanarySnapshot,
} from './prepare-ai-registration-canary-snapshot.mjs';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

test('snapshot scorecard 红绿投影保留闭字段反向状态且不泄露正文', () => {
  [true, false].forEach((scorecardOk) => {
    const projected = projectRegistrationCanarySnapshotScorecard(
      buildRegistrationCanarySnapshotScorecardCall(scorecardOk),
    );
    assert.deepEqual([projected.scorecardOk, projected.isError], [scorecardOk, !scorecardOk]);
    assert.deepEqual(Object.keys(projected).sort(), ['isError', 'maturityReportType', 'nextFocusIdSha256', 'reportType', 'resultSha256', 'scorecardOk']);
    assert.match(`${projected.nextFocusIdSha256}:${projected.resultSha256}`, /^[0-9a-f]{64}:[0-9a-f]{64}$/);
    assert.doesNotMatch(JSON.stringify(projected), /secret|privateDetail|focus/);
  });
  assert.throws(() => projectRegistrationCanarySnapshotScorecard({
    ...buildRegistrationCanarySnapshotScorecardCall(false), isError: false,
  }), /状态或结果契约漂移/);
});
test('snapshot MCP 配置只接受闭合的仓内 keyless server map', () => {
  const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'jsonutils-snapshot-mcp-config-')));
  const configPath = path.join(root, '.mcp.json');
  const canonical = {
    mcpServers: {
      'jsonutils-governance': {
        command: 'node', args: ['scripts/mcp/jsonutils-governance-server.mjs'],
      },
    },
  };
  const writeConfig = value => fs.writeFileSync(configPath, JSON.stringify(value));
  try {
    writeConfig(canonical);
    const server = readRegistrationCanarySnapshotMcpConfig(root);
    assert.deepEqual(server, canonical.mcpServers['jsonutils-governance']);
    assert.equal(Object.isFrozen(server), true);
    assert.equal(Object.isFrozen(server.args), true);

    writeConfig({ ...canonical, metadata: {} });
    assert.throws(() => readRegistrationCanarySnapshotMcpConfig(root), /只接受仓内固定 keyless stdio MCP 配置/);
    writeConfig({ mcpServers: { ...canonical.mcpServers, extra: canonical.mcpServers['jsonutils-governance'] } });
    assert.throws(() => readRegistrationCanarySnapshotMcpConfig(root), /只接受仓内固定 keyless stdio MCP 配置/);
  } finally { removeRegistrationCanarySnapshotFixture(root); }
});
test('snapshot MCP stderr 在 16 KiB 边界闭合并只触发一次终止', () => {
  let stopCount = 0;
  const exact = createRegistrationCanarySnapshotStderrObserver({
    maxBytes: 4, onLimitExceeded: () => { stopCount += 1; },
  });
  exact.observe(Buffer.alloc(2));
  exact.observe('é');
  assert.deepEqual(exact.result(), { byteCount: 4, nonEmpty: true });
  assert.equal(stopCount, 0);

  const overflow = createRegistrationCanarySnapshotStderrObserver({
    maxBytes: 4, onLimitExceeded: () => { stopCount += 1; },
  });
  overflow.observe(Buffer.alloc(5));
  overflow.observe(Buffer.alloc(5));
  assert.equal(stopCount, 1);
  assert.throws(() => overflow.result(), { message: 'snapshot MCP stderr 超出固定上限' });
});
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
  assert.deepEqual(Object.keys(launch.projectionDigests), REGISTRATION_CANARY_SNAPSHOT_PROJECTIONS);
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
        '--run-nonce', digestRegistrationCanarySnapshotFixture('cleanup-run'),
        '--environment-sha256', digestRegistrationCanarySnapshotFixture('cleanup-environment'),
      ],
    }), /cases\.json: 无法读取稳定的有界普通文件/);
    assert.equal(fs.existsSync(outputRoot), true);
    assert.equal(fs.statSync(outputRoot).mode & 0o777, 0o500);
  } finally { removeRegistrationCanarySnapshotFixture(base); }
});
test('真实 sealed snapshot 内 MCP scorecard preflight 绑定同一 packet 且不升级行为声明', { timeout: 180_000 }, async () => {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), 'jsonutils-real-snapshot-preflight-'));
  const snapshotRoot = path.join(base, 'snapshot');
  const args = {
    trialId: 'mcp-registration-p1-baseline',
    runNonce: digestRegistrationCanarySnapshotFixture('snapshot-preflight-run'),
    environmentSha256: digestRegistrationCanarySnapshotFixture('snapshot-preflight-environment-unverified'),
  };
  try {
    const sealed = sealRegistrationCanarySnapshot({
      sourceRoot: rootDir, outputRoot: snapshotRoot, environmentSha256: args.environmentSha256,
    });
    const liveBundle = buildRegistrationCanarySnapshotBundle(rootDir, args);
    const snapshotBundle = buildRegistrationCanarySnapshotBundle(snapshotRoot, args);
    assert.deepEqual(snapshotBundle, liveBundle);

    const preflight = await preflightRegistrationCanarySnapshot({
      snapshotRoot,
      packetBundle: snapshotBundle,
      expectedSnapshotSha256: sealed.snapshotSha256,
    });
    assert.equal(preflight.artifactType, 'ai-registration-canary-snapshot-preflight');
    assert.equal(preflight.preflightVersion, '1.1.0');
    assert.equal(preflight.bindings.fixtureRevision, sealed.fixtureRevision);
    assert.equal(preflight.observations.scorecardObserved, true);
    assert.equal(preflight.mcp.isError, !preflight.mcp.scorecardOk);
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
    assert.ok(preflight.mcp.stderr.byteCount <= REGISTRATION_CANARY_SNAPSHOT_STDERR_MAX_BYTES);
    assert.deepEqual(preflight.mcp.runtimeHome, { stableObserved: true, retained: true, cleanupVerified: false });

    await assert.rejects(() => preflightRegistrationCanarySnapshot({
      snapshotRoot,
      packetBundle: snapshotBundle,
      expectedSnapshotSha256: digestRegistrationCanarySnapshotFixture('wrong-snapshot'),
    }), /expected snapshot digest/);
    const drifted = buildRegistrationCanarySnapshotBundle(snapshotRoot, {
      ...args,
      environmentSha256: digestRegistrationCanarySnapshotFixture('other-environment'),
    });
    await assert.rejects(() => preflightRegistrationCanarySnapshot({
      snapshotRoot,
      packetBundle: drifted,
      expectedSnapshotSha256: sealed.snapshotSha256,
    }), /packet 与 fixture\/environment\/ledger bindings 不匹配/);
  } finally { removeRegistrationCanarySnapshotFixture(base); }
});
