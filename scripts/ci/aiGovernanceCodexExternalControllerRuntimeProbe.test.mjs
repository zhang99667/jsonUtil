import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  CODEX_EXTERNAL_CONTROLLER_RUNTIME_PROBE,
  verifyCodexExternalControllerRuntimeProbeReport,
} from './aiGovernanceCodexExternalControllerRuntimeProbe.mjs';

const digest = character => character.repeat(64);
const workloadImages = {
  'codex-sentinel': digest('1'),
  'mcp-sentinel': digest('2'),
  'validation-sentinel': digest('3'),
};
const bindings = {
  topologyPlanSha256: digest('a'),
  controllerBundleSha256: digest('b'),
  launcherBundleSha256: digest('c'),
  policySha256: digest('d'),
  snapshotSha256: digest('e'),
  trialNonceSha256: digest('f'),
  runtimeBinarySha256: digest('9'),
  workloadImages,
};
const roles = ['codex-sentinel', 'mcp-sentinel', 'validation-sentinel'];
const namespaceDigest = (role, suffix) => digest(String(roles.indexOf(role) + suffix));

const buildWorkload = (role, attempted) => ({
  role,
  attempted,
  imageSha256: workloadImages[role],
  uid: { 'codex-sentinel': 11002, 'mcp-sentinel': 11003, 'validation-sentinel': 11004 }[role],
  pidNamespaceSha256: attempted ? namespaceDigest(role, 1) : null,
  userNamespaceSha256: attempted ? digest('7') : null,
  ipcNamespaceSha256: attempted ? namespaceDigest(role, 2) : null,
  mountNamespaceSha256: attempted ? namespaceDigest(role, 3) : null,
  networkNamespaceSha256: attempted ? namespaceDigest(role, 4) : null,
  authenticationRoot: 'empty',
  snapshotAccess: role === 'codex-sentinel' ? 'absent' : 'read-only',
  foreignCanaryAccess: attempted ? 'denied' : 'not-run',
  privileged: attempted ? false : null,
  noNewPrivileges: attempted ? true : null,
  readOnlyRootFs: attempted ? true : null,
  hostPid: attempted ? false : null,
  hostNetwork: attempted ? false : null,
  dockerSocket: attempted ? false : null,
  hostProc: attempted ? false : null,
  capabilities: attempted ? [] : null,
});

const buildReport = (attempted = false) => ({
  schemaVersion: 1,
  reportType: 'codex-fake-sentinel-runtime-probe',
  contract: {
    id: CODEX_EXTERNAL_CONTROLLER_RUNTIME_PROBE.id,
    version: CODEX_EXTERNAL_CONTROLLER_RUNTIME_PROBE.version,
    evidenceScope: 'component-only',
    coverage: CODEX_EXTERNAL_CONTROLLER_RUNTIME_PROBE.coverage,
    producer: 'project-plugin-installed-copy-unverified',
  },
  bindings: structuredClone(bindings),
  execution: {
    origin: 'project-plugin-installed-copy-unverified',
    runtimeAttempted: attempted,
    realCodexSpawns: 0,
    modelInvocations: 0,
    credentialMaterialPresent: false,
    candidateGenerated: false,
    automaticLedgerWrites: false,
    retryCount: 0,
    externalNetworkConnections: 0,
    cleanupComplete: true,
  },
  runtime: {
    kind: 'docker',
    clientAvailable: true,
    serverAvailable: attempted,
    imagePresent: attempted,
    pullPolicy: 'never',
    eciStatus: 'unverified',
    evidenceOrigin: 'self-reported-unverified',
  },
  workloads: roles.map(role => buildWorkload(role, attempted)),
  snapshot: {
    mountedRoles: attempted ? ['mcp-sentinel', 'validation-sentinel'] : [],
    digestBefore: digest('e'),
    digestAfter: digest('e'),
    writeAttemptsDenied: attempted ? true : null,
    liveCheckoutMounted: false,
    ledgerFilesPresent: false,
  },
  result: {
    status: attempted ? 'passed-subset' : 'not-run',
    runtimeProbeObserved: attempted,
    runtimeIsolationVerified: false,
    controllerIsolationVerified: false,
    userNamespaceVerified: false,
    signerVerified: false,
    trustedSigners: 0,
    topologyComplete: false,
    outcomeEligible: false,
    confirmedCoverageEligible: false,
    failures: attempted ? [] : ['docker-server-unavailable'],
  },
});

const verify = report => verifyCodexExternalControllerRuntimeProbeReport({
  reportJson: JSON.stringify(report),
  expectedBindings: bindings,
});

test('runtime probe 接受诚实的 daemon unavailable 报告但不产生运行时证明', () => {
  const result = verify(buildReport());
  assert.equal(result.ok, true);
  assert.equal(result.verificationStatus, 'runtime-not-observed');
  assert.equal(result.runtimeProbeObserved, false);
  assert.equal(result.runtimeIsolationVerified, false);
  assert.equal(result.outcomeEligible, false);
  assert.match(result.reportSha256, /^[0-9a-f]{64}$/);
});

test('runtime probe 的三 workload 子集通过后仍保持 component-only', () => {
  const result = verify(buildReport(true));
  assert.equal(result.ok, true);
  assert.equal(result.verificationStatus, 'component-subset-observed');
  assert.equal(result.runtimeProbeObserved, true);
  assert.equal(result.controllerIsolationVerified, false);
  assert.equal(result.userNamespaceVerified, false);
  assert.equal(result.signerVerified, false);
  assert.equal(result.trustedSigners, 0);
  assert.equal(result.confirmedCoverageEligible, false);
});

test('runtime probe 拒绝额外字段和 host binding 漂移', () => {
  const report = buildReport();
  report.command = 'docker run';
  assert.throws(() => verify(report), /闭字段对象/);
  delete report.command;
  report.bindings.snapshotSha256 = digest('8');
  assert.throws(() => verify(report), /host expectedBindings 不匹配/);
});

test('runtime probe 拒绝模型、账本写入和可信运行时过度声明', () => {
  const report = buildReport(true);
  report.execution.realCodexSpawns = 1;
  report.execution.modelInvocations = 1;
  report.execution.automaticLedgerWrites = true;
  report.result.runtimeIsolationVerified = true;
  report.result.trustedSigners = 1;
  report.result.outcomeEligible = true;
  assert.deepEqual(verify(report).failures, ['execution-boundary-invalid', 'claim-boundary-invalid']);
});

test('runtime probe 拒绝共享 namespace、宿主能力和 snapshot/canary 漂移', () => {
  const report = buildReport(true);
  report.workloads[1].pidNamespaceSha256 = report.workloads[0].pidNamespaceSha256;
  report.workloads[1].snapshotAccess = 'read-write';
  report.workloads[2].foreignCanaryAccess = 'allowed';
  report.workloads[0].dockerSocket = true;
  report.snapshot.digestAfter = digest('8');
  assert.deepEqual(verify(report).failures, [
    'namespace-not-isolated', 'unsafe-runtime-capability',
    'workload-boundary-invalid', 'snapshot-boundary-invalid',
  ]);
});

test('runtime probe 拒绝未清理或虚假的执行状态', () => {
  const report = buildReport();
  report.execution.cleanupComplete = false;
  report.result.runtimeProbeObserved = true;
  report.result.failures = [];
  assert.deepEqual(verify(report).failures, ['cleanup-incomplete', 'status-claim-invalid']);
});

test('runtime probe 拒绝项目插件安装副本自报 ECI 已验证', () => {
  const report = buildReport();
  report.runtime.eciStatus = 'verified';
  assert.deepEqual(verify(report).failures, ['runtime-boundary-invalid']);
});
