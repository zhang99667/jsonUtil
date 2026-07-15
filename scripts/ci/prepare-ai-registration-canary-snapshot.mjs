#!/usr/bin/env node
// 在 checkout 外封存 registration snapshot，复核 live/snapshot packet 一致性并运行只读 MCP preflight。

import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { preflightRegistrationCanarySnapshot } from './aiGovernanceRegistrationCanarySnapshotPreflight.mjs';
import { sealRegistrationCanarySnapshot } from './aiGovernanceRegistrationCanarySealedSnapshot.mjs';
import { prepareRegistrationCanaryProjection } from './prepare-ai-registration-canary.mjs';

const defaultRootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const SHA256_PATTERN = /^[0-9a-f]{64}$/;
const PROJECTIONS = ['agent', 'grader', 'host'];
const projectionDigest = (projection, value) => createHash('sha256').update(JSON.stringify({
  domain: 'jsonutils.registration-snapshot.projection/v1',
  projection,
  value,
})).digest('hex');

const parseArgs = (argv) => {
  const allowed = new Set(['--output', '--trial', '--run-nonce', '--environment-sha256']);
  const values = {};
  if (argv.length !== allowed.size * 2) throw new Error('必须提供 output/trial/run-nonce/environment-sha256');
  for (let index = 0; index < argv.length; index += 2) {
    const key = argv[index], value = argv[index + 1];
    if (!allowed.has(key) || Object.hasOwn(values, key) || !value || value.startsWith('--')) {
      throw new Error(`不支持、重复或缺值参数：${key ?? '<empty>'}`);
    }
    values[key] = value;
  }
  if (!SHA256_PATTERN.test(values['--run-nonce']) || !SHA256_PATTERN.test(values['--environment-sha256'])) {
    throw new Error('run nonce 与 environment digest 必须是 64 位小写 SHA-256');
  }
  return {
    outputRoot: path.resolve(values['--output']),
    trialId: values['--trial'],
    runNonce: values['--run-nonce'],
    environmentSha256: values['--environment-sha256'],
  };
};

const buildBundle = ({ projectRoot, trialId, runNonce, environmentSha256 }) => Object.fromEntries(PROJECTIONS.map(projection => [
  projection,
  prepareRegistrationCanaryProjection({
    projectRoot,
    argv: [
      '--trial', trialId,
      '--projection', projection,
      '--run-nonce', runNonce,
      '--environment-sha256', environmentSha256,
    ],
  }),
]));

export const buildRegistrationCanarySnapshotLaunch = ({ sealed, snapshotBundle, preflight }) => ({
  schemaVersion: 1,
  artifactType: 'ai-registration-canary-snapshot-launch',
  dataClass: 'redacted',
  snapshot: {
    manifestVersion: sealed.manifest.manifestVersion,
    snapshotSha256: sealed.snapshotSha256,
    manifestFileSha256: sealed.manifestFileSha256,
    fixtureRevision: sealed.fixtureRevision,
    environmentSha256: sealed.environmentSha256,
    sourceDataClass: sealed.manifest.dataClass,
    entryCount: sealed.manifest.bounds.entryCount,
    totalBytes: sealed.manifest.bounds.totalBytes,
  },
  projectionDigests: Object.fromEntries(PROJECTIONS.map(projection => [
    projection,
    projectionDigest(projection, snapshotBundle[projection]),
  ])),
  preflight,
  claims: {
    evidenceScope: 'component-only',
    externalLeaseAcquired: false,
    modelInvocationRequested: false,
    modelInvocationAbsenceVerified: false,
    trialExecutionObserved: false,
    currentTaskRegistryVerified: false,
    outcomeEligible: false,
    ledgerWriteRequested: false,
    ledgerWriteAbsenceVerified: false,
    descendantCleanupVerified: false,
    temporaryHomeCleanupVerified: false,
  },
});

export const prepareRegistrationCanarySnapshot = async ({ argv = process.argv.slice(2), sourceRoot = defaultRootDir } = {}) => {
  const args = parseArgs(argv);
  const sealed = sealRegistrationCanarySnapshot({
    sourceRoot,
    outputRoot: args.outputRoot,
    environmentSha256: args.environmentSha256,
  });
  const liveBundle = buildBundle({ projectRoot: sourceRoot, ...args });
  const snapshotBundle = buildBundle({ projectRoot: args.outputRoot, ...args });
  if (JSON.stringify(liveBundle) !== JSON.stringify(snapshotBundle)) {
    throw new Error('live checkout 与 sealed snapshot 的 registration packet 不一致');
  }
  const preflight = await preflightRegistrationCanarySnapshot({
    snapshotRoot: args.outputRoot,
    packetBundle: snapshotBundle,
    expectedSnapshotSha256: sealed.snapshotSha256,
  });
  return buildRegistrationCanarySnapshotLaunch({ sealed, snapshotBundle, preflight });
};

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  try { process.stdout.write(`${JSON.stringify(await prepareRegistrationCanarySnapshot())}\n`); }
  catch { console.error('registration canary snapshot 生成失败（诊断已脱敏）'); process.exitCode = 1; }
}
