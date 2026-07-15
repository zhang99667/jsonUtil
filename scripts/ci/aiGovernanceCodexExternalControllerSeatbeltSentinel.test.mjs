import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  CODEX_EXTERNAL_CONTROLLER_SEATBELT_SENTINEL,
  verifyCodexExternalControllerSeatbeltSentinelReport,
} from './aiGovernanceCodexExternalControllerSeatbeltSentinel.mjs';

const digest = character => character.repeat(64);
const bindings = {
  snapshotRevision: `worktree-${digest('a')}`,
  snapshotManifestSha256: digest('b'),
  snapshotTreeSha256: digest('c'),
  controllerBundleSha256: digest('d'),
  childBundleSha256: digest('6'),
  nodeRuntimeSha256: digest('7'),
  launcherBundleSha256: digest('e'),
  policySha256: digest('f'),
  trialNonceSha256: digest('1'),
  sandboxBinarySha256: digest('2'),
  codexBinarySha256: digest('3'),
  codexCodeIdentitySha256: digest('8'),
  codexVersion: 'codex-cli 0.144.0-alpha.4',
  codexSandboxHelpSha256: digest('4'),
};

const buildReport = (passed = true) => ({
  schemaVersion: 2,
  reportType: 'codex-external-controller-seatbelt-sentinel',
  contract: {
    id: CODEX_EXTERNAL_CONTROLLER_SEATBELT_SENTINEL.id,
    version: CODEX_EXTERNAL_CONTROLLER_SEATBELT_SENTINEL.version,
    evidenceScope: 'component-only',
    coverage: CODEX_EXTERNAL_CONTROLLER_SEATBELT_SENTINEL.coverage,
    producer: 'project-plugin-installed-copy-unverified',
  },
  bindings: structuredClone(bindings),
  execution: {
    origin: 'project-plugin-installed-copy-unverified',
    platform: 'darwin',
    architecture: 'arm64',
    sandboxMechanism: 'seatbelt-direct',
    sandboxCommandObserved: passed,
    realCodexAgentSpawns: 0,
    modelInvocationRequested: false,
    credentialMaterialRequested: false,
    candidateGenerated: false,
    automaticLedgerWrites: false,
    retryCount: 0,
  },
  observations: {
    codexPreflight: {
      staticBindingsMatched: passed, codeIdentityMatched: passed, versionMatched: passed,
      sandboxHelpMatched: passed, seatbeltProfileObserved: passed,
      postflightBindingsMatched: passed,
    },
    syntheticSecret: { baselineReadObserved: passed, sandboxReadDenied: passed, canarySha256: digest('5') },
    liveCheckout: { baselineReadObserved: passed, sandboxReadDenied: passed },
    snapshot: {
      sourceMutationAttempted: false,
      sourceDigestBefore: digest('0'),
      sourceDigestAfter: digest('0'),
      manifestReadObserved: passed,
      manifestReadSha256: bindings.snapshotManifestSha256,
      ledgerCopiesPresent: passed,
      disposableMirrorBaselineChmodObserved: passed,
      disposableMirrorBaselineWriteObserved: passed,
      disposableMirrorChmodDenied: passed,
      disposableMirrorWriteDenied: passed,
      disposableMirrorDigestBefore: digest('9'),
      disposableMirrorDigestAfter: digest('9'),
    },
    network: { loopbackBaselineConnected: passed, sandboxLoopbackDenied: passed },
    processInfo: { siblingBaselineVisible: passed, sandboxSiblingInfoDenied: passed, sameUidObserved: passed },
    cleanup: { childrenExited: passed, tempEntriesRemoved: passed, residualNonceObjects: passed ? 0 : 1 },
  },
  claims: {
    seatbeltPolicyObserved: passed,
    snapshotIntegrityObserved: passed,
    syntheticSecretPolicyObserved: passed,
    networkPolicyObserved: passed,
    processInfoPolicyObserved: passed,
    boundedCleanupObserved: passed,
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
  },
  result: {
    status: passed ? 'passed-subset' : 'rejected',
    runtimeSubsetExecutionObserved: passed,
    failures: passed ? [] : ['bounded-cleanup-not-observed'],
  },
});

const verify = report => verifyCodexExternalControllerSeatbeltSentinelReport({
  reportJson: JSON.stringify(report),
  expectedBindings: bindings,
});

test('Seatbelt sentinel 接受完整真实观察但保持 component-only', () => {
  const result = verify(buildReport());
  assert.equal(result.ok, true);
  assert.equal(result.verificationStatus, 'component-subset-observed');
  assert.equal(result.runtimeSubsetExecutionObserved, true);
  assert.equal(result.seatbeltPolicyObserved, true);
  assert.equal(result.runtimeIsolationVerified, false);
  assert.equal(result.controllerIsolationVerified, false);
  assert.equal(result.userNamespaceVerified, false);
  assert.equal(result.pidNamespaceVerified, false);
  assert.equal(result.trustedSigners, 0);
  assert.equal(result.outcomeEligible, false);
  assert.equal(result.modelInvocationAbsenceVerified, false);
  assert.match(result.reportSha256, /^[0-9a-f]{64}$/);
  const reversedBindings = Object.fromEntries(Object.entries(bindings).reverse());
  assert.equal(verifyCodexExternalControllerSeatbeltSentinelReport({
    reportJson: JSON.stringify(buildReport()), expectedBindings: reversedBindings,
  }).ok, true);
});

test('Seatbelt sentinel 接受诚实 rejected 执行但不伪造观察', () => {
  const result = verify(buildReport(false));
  assert.equal(result.ok, true);
  assert.equal(result.verificationStatus, 'component-subset-execution-rejected');
  assert.equal(result.runtimeSubsetExecutionObserved, false);
  assert.equal(result.seatbeltPolicyObserved, false);
  const attempted = buildReport(false);
  Object.assign(attempted.execution, { sandboxCommandObserved: true });
  Object.assign(attempted.observations.codexPreflight, {
    staticBindingsMatched: true, codeIdentityMatched: true, versionMatched: true,
    sandboxHelpMatched: true, seatbeltProfileObserved: true, postflightBindingsMatched: true,
  });
  Object.assign(attempted.observations.syntheticSecret, { baselineReadObserved: true, sandboxReadDenied: true });
  Object.assign(attempted.observations.liveCheckout, { baselineReadObserved: true, sandboxReadDenied: true });
  Object.assign(attempted.observations.snapshot, {
    manifestReadObserved: true, ledgerCopiesPresent: true,
    disposableMirrorBaselineChmodObserved: true,
    disposableMirrorBaselineWriteObserved: true,
    disposableMirrorChmodDenied: true, disposableMirrorWriteDenied: true,
  });
  Object.assign(attempted.observations.processInfo, { siblingBaselineVisible: true, sandboxSiblingInfoDenied: true, sameUidObserved: true });
  Object.assign(attempted.observations.cleanup, { childrenExited: true, tempEntriesRemoved: true, residualNonceObjects: 0 });
  Object.assign(attempted.claims, { snapshotIntegrityObserved: true, syntheticSecretPolicyObserved: true, processInfoPolicyObserved: true, boundedCleanupObserved: true });
  Object.assign(attempted.result, { runtimeSubsetExecutionObserved: true, failures: ['network-policy-not-observed'] });
  assert.equal(verify(attempted).runtimeSubsetExecutionObserved, true);
});

test('Seatbelt sentinel 拒绝额外字段、非紧凑 JSON 与 host binding 漂移', () => {
  const report = buildReport();
  report.outputPath = '/private/tmp/report.json';
  assert.throws(() => verify(report), /闭字段对象/);
  delete report.outputPath;
  assert.throws(() => verifyCodexExternalControllerSeatbeltSentinelReport({
    reportJson: JSON.stringify(report, null, 2), expectedBindings: bindings,
  }), /精确紧凑/);
  report.bindings.snapshotTreeSha256 = digest('9');
  assert.deepEqual(verify(report).failures, ['host-binding-mismatch']);
});

test('Seatbelt sentinel 拒绝非法 revision、digest 与 Codex 版本', () => {
  const report = buildReport();
  report.bindings.snapshotRevision = 'main';
  report.bindings.policySha256 = 'not-a-digest';
  report.bindings.codexVersion = '/Applications/Codex.app';
  const expected = structuredClone(report.bindings);
  const result = verifyCodexExternalControllerSeatbeltSentinelReport({
    reportJson: JSON.stringify(report), expectedBindings: expected,
  });
  assert.deepEqual(result.failures, ['binding-shape-invalid']);
});

test('Seatbelt sentinel 要求控制组、deny、snapshot 稳定与 cleanup 同时成立', () => {
  const report = buildReport();
  report.observations.syntheticSecret.baselineReadObserved = false;
  report.observations.snapshot.sourceDigestAfter = digest('a');
  report.observations.network.sandboxLoopbackDenied = false;
  report.observations.cleanup.residualNonceObjects = 1;
  assert.deepEqual(verify(report).failures, ['claim-boundary-invalid', 'status-claim-invalid']);
});

test('Seatbelt sentinel 拒绝 runtime、namespace、signer 与 outcome 过度声明', () => {
  const report = buildReport();
  report.claims.secretIsolationVerified = true;
  report.claims.immutableMountVerified = true;
  report.claims.pidNamespaceVerified = true;
  report.claims.userNamespaceVerified = true;
  report.claims.controllerIsolationVerified = true;
  report.claims.signerIsolationVerified = true;
  report.claims.trustedSigners = 1;
  report.claims.modelInvocationAbsenceVerified = true;
  report.claims.currentTaskRegistryVerified = true;
  report.claims.topologyComplete = true;
  report.claims.outcomeEligible = true;
  report.claims.confirmedCoverageEligible = true;
  assert.deepEqual(verify(report).failures, ['claim-boundary-invalid']);
});

test('Seatbelt sentinel 拒绝模型、凭据、重试与自动写账请求', () => {
  const report = buildReport();
  report.execution.realCodexAgentSpawns = 1;
  report.execution.modelInvocationRequested = true;
  report.execution.credentialMaterialRequested = true;
  report.execution.automaticLedgerWrites = true;
  report.execution.retryCount = 1;
  assert.deepEqual(verify(report).failures, ['execution-boundary-invalid']);
});

test('Seatbelt sentinel failures 只允许固定安全 id', () => {
  const report = buildReport(false);
  report.result.failures = ['sandbox-command-failed'];
  assert.deepEqual(verify(report).failures, ['status-claim-invalid']);
});

test('Seatbelt sentinel source snapshot 永不接受变更探针且 ledger 副本为可选', () => {
  const report = buildReport();
  report.observations.snapshot.ledgerCopiesPresent = false;
  assert.equal(verify(report).ok, true);
  report.observations.snapshot.sourceMutationAttempted = true;
  assert.deepEqual(verify(report).failures,
    ['report-value-shape-invalid', 'claim-boundary-invalid', 'status-claim-invalid']);
});

test('Seatbelt sentinel 独立锁定 observation/claim 值类型与 nullable digest', () => {
  const report = buildReport(false);
  report.observations.codexPreflight.staticBindingsMatched = 'true';
  report.observations.syntheticSecret.canarySha256 = '/private/tmp/canary';
  report.observations.snapshot.sourceDigestBefore = {};
  report.observations.snapshot.sourceDigestAfter = [];
  report.observations.snapshot.manifestReadSha256 = '/snapshot/manifest';
  report.observations.snapshot.disposableMirrorDigestBefore = ['digest'];
  report.observations.cleanup.residualNonceObjects = '0';
  report.claims.seatbeltPolicyObserved = 'false';
  assert.equal(verify(report).failures.includes('report-value-shape-invalid'), true);
});
