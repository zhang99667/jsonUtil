import { createHash } from 'node:crypto';

import { collectSeatbeltSentinelReportShapeFailures } from './aiGovernanceCodexExternalControllerSeatbeltReportShape.mjs';

export const CODEX_EXTERNAL_CONTROLLER_SEATBELT_SENTINEL = Object.freeze({
  id: 'codex-external-controller-seatbelt-sentinel-execution',
  version: '2.2.0',
  caseId: 'codex-external-controller-seatbelt-sentinel-boundary',
  coverage: 'macos-seatbelt-policy-subset',
});

const MAX_REPORT_BYTES = 128 * 1024;
const SHA256_PATTERN = /^[0-9a-f]{64}$/;
const REVISION_PATTERN = /^worktree-[0-9a-f]{64}$/;
const SAFE_ID_PATTERN = /^[a-z][a-z0-9-]{0,99}$/;
const CODEX_VERSION_PATTERN = /^codex-cli [0-9A-Za-z.+-]{1,80}$/;
const REPORT_FAILURE_IDS = new Set([
  'sandbox-binary-digest-mismatch', 'codex-binary-digest-mismatch', 'codex-version-mismatch',
  'codex-code-identity-mismatch', 'codex-sandbox-help-mismatch', 'snapshot-revision-mismatch',
  'snapshot-manifest-digest-mismatch', 'snapshot-tree-digest-mismatch',
  'controller-bundle-digest-mismatch', 'child-bundle-digest-mismatch',
  'node-runtime-digest-mismatch', 'launcher-bundle-digest-mismatch',
  'policy-digest-mismatch', 'static-binding-mismatch', 'codex-seatbelt-profile-not-observed',
  'controller-postflight-drift', 'snapshot-postflight-drift',
  'synthetic-secret-policy-not-observed', 'live-checkout-policy-not-observed',
  'snapshot-integrity-not-observed', 'network-policy-not-observed',
  'process-info-policy-not-observed', 'bounded-cleanup-not-observed',
]);
const EXACT_FIELDS = Object.freeze({
  report: ['schemaVersion', 'reportType', 'contract', 'bindings', 'execution', 'observations', 'claims', 'result'],
  contract: ['id', 'version', 'evidenceScope', 'coverage', 'producer'],
  bindings: [
    'snapshotRevision', 'snapshotManifestSha256', 'snapshotTreeSha256',
    'controllerBundleSha256', 'childBundleSha256', 'nodeRuntimeSha256',
    'launcherBundleSha256', 'policySha256',
    'trialNonceSha256', 'sandboxBinarySha256', 'codexBinarySha256',
    'codexCodeIdentitySha256', 'codexVersion', 'codexSandboxHelpSha256',
  ],
  execution: [
    'origin', 'platform', 'architecture', 'sandboxMechanism', 'sandboxCommandObserved',
    'realCodexAgentSpawns', 'modelInvocationRequested', 'credentialMaterialRequested',
    'candidateGenerated', 'automaticLedgerWrites', 'retryCount',
  ],
  observations: ['codexPreflight', 'syntheticSecret', 'liveCheckout', 'snapshot', 'network', 'processInfo', 'cleanup'],
  codexPreflight: [
    'staticBindingsMatched', 'codeIdentityMatched', 'versionMatched', 'sandboxHelpMatched',
    'seatbeltProfileObserved', 'postflightBindingsMatched',
  ],
  syntheticSecret: ['baselineReadObserved', 'sandboxReadDenied', 'canarySha256'],
  liveCheckout: ['baselineReadObserved', 'sandboxReadDenied'],
  snapshot: [
    'sourceMutationAttempted', 'sourceDigestBefore', 'sourceDigestAfter',
    'manifestReadObserved', 'manifestReadSha256', 'ledgerCopiesPresent',
    'disposableMirrorBaselineChmodObserved', 'disposableMirrorBaselineWriteObserved',
    'disposableMirrorChmodDenied', 'disposableMirrorWriteDenied',
    'disposableMirrorDigestBefore', 'disposableMirrorDigestAfter',
  ],
  network: ['loopbackBaselineConnected', 'sandboxLoopbackDenied'],
  processInfo: ['siblingBaselineVisible', 'sandboxSiblingInfoDenied', 'sameUidObserved'],
  cleanup: ['childrenExited', 'tempEntriesRemoved', 'residualNonceObjects'],
  claims: [
    'seatbeltPolicyObserved', 'snapshotIntegrityObserved', 'syntheticSecretPolicyObserved',
    'networkPolicyObserved', 'processInfoPolicyObserved', 'boundedCleanupObserved',
    'secretIsolationVerified', 'immutableMountVerified', 'pidNamespaceVerified',
    'userNamespaceVerified', 'controllerIsolationVerified', 'signerIsolationVerified',
    'trustedSigners', 'modelInvocationAbsenceVerified', 'currentTaskRegistryVerified',
    'topologyComplete', 'outcomeEligible', 'confirmedCoverageEligible',
  ],
  result: ['status', 'runtimeSubsetExecutionObserved', 'failures'],
});

const isRecord = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const assertExactFields = (value, fields, label) => {
  if (!isRecord(value) || Object.keys(value).length !== fields.length
    || fields.some(field => !Object.hasOwn(value, field))) {
    throw new TypeError(`${label} 必须是闭字段对象`);
  }
};
const allTrue = (value, fields) => fields.every(field => value[field] === true);
const allFalse = (value, fields) => fields.every(field => value[field] === false);

const parseReport = (reportJson) => {
  if (typeof reportJson !== 'string' || Buffer.byteLength(reportJson, 'utf8') > MAX_REPORT_BYTES) {
    throw new TypeError('reportJson 必须是至多 128 KiB 的 JSON 字符串');
  }
  let report;
  try { report = JSON.parse(reportJson); } catch { throw new TypeError('reportJson 不是合法 JSON'); }
  if (reportJson !== JSON.stringify(report)) throw new TypeError('reportJson 必须使用精确紧凑 JSON 编码');
  assertExactFields(report, EXACT_FIELDS.report, 'Seatbelt sentinel report');
  for (const field of ['contract', 'bindings', 'execution', 'observations', 'claims', 'result']) {
    assertExactFields(report[field], EXACT_FIELDS[field], `Seatbelt sentinel report.${field}`);
  }
  for (const field of EXACT_FIELDS.observations) {
    assertExactFields(report.observations[field], EXACT_FIELDS[field], `Seatbelt sentinel observations.${field}`);
  }
  return report;
};

const collectBindingFailures = (bindings, expectedBindings) => {
  assertExactFields(expectedBindings, EXACT_FIELDS.bindings, 'expectedBindings');
  const failures = [];
  const digestFields = EXACT_FIELDS.bindings.filter(field => field.endsWith('Sha256'));
  if (!REVISION_PATTERN.test(bindings.snapshotRevision ?? '')
    || !digestFields.every(field => SHA256_PATTERN.test(bindings[field] ?? ''))
    || !CODEX_VERSION_PATTERN.test(bindings.codexVersion ?? '')) failures.push('binding-shape-invalid');
  if (EXACT_FIELDS.bindings.some(field => bindings[field] !== expectedBindings[field])) {
    failures.push('host-binding-mismatch');
  }
  return failures;
};

const derivePositiveClaims = ({ bindings, observations }) => {
  const { codexPreflight, syntheticSecret, liveCheckout, snapshot, network, processInfo, cleanup } = observations;
  const syntheticSecretPolicyObserved = allTrue(syntheticSecret, ['baselineReadObserved', 'sandboxReadDenied'])
    && SHA256_PATTERN.test(syntheticSecret.canarySha256 ?? '');
  const liveCheckoutPolicyObserved = allTrue(liveCheckout, EXACT_FIELDS.liveCheckout);
  const snapshotIntegrityObserved = snapshot.sourceMutationAttempted === false
    && typeof snapshot.ledgerCopiesPresent === 'boolean'
    && allTrue(snapshot, [
      'manifestReadObserved', 'disposableMirrorBaselineChmodObserved',
      'disposableMirrorBaselineWriteObserved', 'disposableMirrorChmodDenied',
      'disposableMirrorWriteDenied',
    ])
    && snapshot.manifestReadSha256 === bindings.snapshotManifestSha256
    && SHA256_PATTERN.test(snapshot.sourceDigestBefore ?? '')
    && snapshot.sourceDigestBefore === snapshot.sourceDigestAfter
    && SHA256_PATTERN.test(snapshot.disposableMirrorDigestBefore ?? '')
    && snapshot.disposableMirrorDigestBefore === snapshot.disposableMirrorDigestAfter;
  const networkPolicyObserved = allTrue(network, EXACT_FIELDS.network);
  const processInfoPolicyObserved = allTrue(processInfo, EXACT_FIELDS.processInfo);
  const boundedCleanupObserved = allTrue(cleanup, ['childrenExited', 'tempEntriesRemoved'])
    && cleanup.residualNonceObjects === 0;
  return {
    seatbeltPolicyObserved: syntheticSecretPolicyObserved && liveCheckoutPolicyObserved
      && snapshotIntegrityObserved && networkPolicyObserved && processInfoPolicyObserved,
    snapshotIntegrityObserved, syntheticSecretPolicyObserved, networkPolicyObserved,
    processInfoPolicyObserved, boundedCleanupObserved,
    complete: allTrue(codexPreflight, EXACT_FIELDS.codexPreflight)
      && syntheticSecretPolicyObserved && liveCheckoutPolicyObserved && snapshotIntegrityObserved
      && networkPolicyObserved && processInfoPolicyObserved && boundedCleanupObserved,
  };
};

export const verifyCodexExternalControllerSeatbeltSentinelReport = ({ reportJson, expectedBindings }) => {
  const report = parseReport(reportJson);
  const { contract, bindings, execution, observations, claims, result } = report;
  const failures = [...collectBindingFailures(bindings, expectedBindings),
    ...collectSeatbeltSentinelReportShapeFailures({ observations, claims })];
  if (report.schemaVersion !== 2 || report.reportType !== 'codex-external-controller-seatbelt-sentinel'
    || contract.id !== CODEX_EXTERNAL_CONTROLLER_SEATBELT_SENTINEL.id
    || contract.version !== CODEX_EXTERNAL_CONTROLLER_SEATBELT_SENTINEL.version
    || contract.evidenceScope !== 'component-only'
    || contract.coverage !== CODEX_EXTERNAL_CONTROLLER_SEATBELT_SENTINEL.coverage
    || contract.producer !== 'project-plugin-installed-copy-unverified') failures.push('contract-boundary-invalid');
  if (execution.origin !== 'project-plugin-installed-copy-unverified' || execution.platform !== 'darwin'
    || !['arm64', 'x86_64'].includes(execution.architecture)
    || execution.sandboxMechanism !== 'seatbelt-direct'
    || typeof execution.sandboxCommandObserved !== 'boolean'
    || execution.realCodexAgentSpawns !== 0 || execution.modelInvocationRequested !== false
    || execution.credentialMaterialRequested !== false || execution.candidateGenerated !== false
    || execution.automaticLedgerWrites !== false || execution.retryCount !== 0) {
    failures.push('execution-boundary-invalid');
  }
  const observedClaims = derivePositiveClaims(report);
  const positiveClaims = [
    'seatbeltPolicyObserved', 'snapshotIntegrityObserved', 'syntheticSecretPolicyObserved',
    'networkPolicyObserved', 'processInfoPolicyObserved', 'boundedCleanupObserved',
  ];
  const forbiddenClaims = [
    'secretIsolationVerified', 'immutableMountVerified', 'pidNamespaceVerified',
    'userNamespaceVerified', 'controllerIsolationVerified', 'signerIsolationVerified',
    'modelInvocationAbsenceVerified', 'currentTaskRegistryVerified', 'topologyComplete',
    'outcomeEligible', 'confirmedCoverageEligible',
  ];
  if (!allFalse(claims, forbiddenClaims) || claims.trustedSigners !== 0
    || positiveClaims.some(field => claims[field] !== observedClaims[field])) {
    failures.push('claim-boundary-invalid');
  }
  const passed = result.status === 'passed-subset';
  const fixedFailureIds = Array.isArray(result.failures)
    && result.failures.every(value => SAFE_ID_PATTERN.test(value) && REPORT_FAILURE_IDS.has(value))
    && new Set(result.failures).size === result.failures.length;
  if (typeof result.runtimeSubsetExecutionObserved !== 'boolean'
    || result.runtimeSubsetExecutionObserved !== execution.sandboxCommandObserved
    || !Array.isArray(result.failures)
    || !fixedFailureIds
    || (passed ? !observedClaims.complete || !execution.sandboxCommandObserved
      || result.failures.length !== 0 : result.status !== 'rejected' || result.failures.length === 0)) {
    failures.push('status-claim-invalid');
  }
  const uniqueFailures = [...new Set(failures)];
  return Object.freeze({
    schemaVersion: 1,
    reportType: 'codex-external-controller-seatbelt-sentinel-verification',
    sentinel: CODEX_EXTERNAL_CONTROLLER_SEATBELT_SENTINEL,
    ok: uniqueFailures.length === 0,
    verificationStatus: uniqueFailures.length > 0
      ? 'rejected' : passed ? 'component-subset-observed' : 'component-subset-execution-rejected',
    evidenceScope: 'component-only',
    captureOrigin: 'personal-plugin-self-report-unverified',
    runtimeSubsetExecutionObserved: uniqueFailures.length === 0 && result.runtimeSubsetExecutionObserved,
    seatbeltPolicyObserved: uniqueFailures.length === 0 && claims.seatbeltPolicyObserved,
    runtimeIsolationVerified: false,
    controllerIsolationVerified: false,
    userNamespaceVerified: false,
    pidNamespaceVerified: false,
    signerVerified: false,
    trustedSigners: 0,
    outcomeEligible: false,
    confirmedCoverageEligible: false,
    modelInvocationRequested: false,
    modelInvocationAbsenceVerified: false,
    reportSha256: createHash('sha256').update(reportJson).digest('hex'),
    failures: uniqueFailures,
  });
};
