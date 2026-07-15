import { createHash } from 'node:crypto';

export const CODEX_EXTERNAL_CONTROLLER_RUNTIME_PROBE = Object.freeze({
  id: 'codex-external-controller-runtime-probe',
  version: '1.1.0',
  caseId: 'codex-external-controller-runtime-probe-boundary',
  coverage: 'credential-snapshot-subset',
});

const MAX_REPORT_BYTES = 128 * 1024;
const SHA256_PATTERN = /^[0-9a-f]{64}$/;
const SAFE_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]{0,99}$/;
const WORKLOAD_ROLES = Object.freeze(['codex-sentinel', 'mcp-sentinel', 'validation-sentinel']);
const SNAPSHOT_ROLES = Object.freeze(['mcp-sentinel', 'validation-sentinel']);
const EXACT_FIELDS = Object.freeze({
  report: ['schemaVersion', 'reportType', 'contract', 'bindings', 'execution', 'runtime', 'workloads', 'snapshot', 'result'],
  contract: ['id', 'version', 'evidenceScope', 'coverage', 'producer'],
  bindings: [
    'topologyPlanSha256', 'controllerBundleSha256', 'launcherBundleSha256', 'policySha256',
    'snapshotSha256', 'trialNonceSha256', 'runtimeBinarySha256', 'workloadImages',
  ],
  workloadImages: WORKLOAD_ROLES,
  execution: [
    'origin', 'runtimeAttempted', 'realCodexSpawns', 'modelInvocations',
    'credentialMaterialPresent', 'candidateGenerated', 'automaticLedgerWrites', 'retryCount',
    'externalNetworkConnections', 'cleanupComplete',
  ],
  runtime: [
    'kind', 'clientAvailable', 'serverAvailable', 'imagePresent', 'pullPolicy',
    'eciStatus', 'evidenceOrigin',
  ],
  workload: [
    'role', 'attempted', 'imageSha256', 'uid', 'pidNamespaceSha256',
    'userNamespaceSha256', 'ipcNamespaceSha256', 'mountNamespaceSha256',
    'networkNamespaceSha256', 'authenticationRoot', 'snapshotAccess',
    'foreignCanaryAccess', 'privileged', 'noNewPrivileges', 'readOnlyRootFs',
    'hostPid', 'hostNetwork', 'dockerSocket', 'hostProc', 'capabilities',
  ],
  snapshot: [
    'mountedRoles', 'digestBefore', 'digestAfter', 'writeAttemptsDenied',
    'liveCheckoutMounted', 'ledgerFilesPresent',
  ],
  result: [
    'status', 'runtimeProbeObserved', 'runtimeIsolationVerified',
    'controllerIsolationVerified', 'userNamespaceVerified', 'signerVerified',
    'trustedSigners', 'topologyComplete', 'outcomeEligible',
    'confirmedCoverageEligible', 'failures',
  ],
});

const isRecord = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const isNullableBoolean = value => value === null || typeof value === 'boolean';
const isNullableSha256 = value => value === null || SHA256_PATTERN.test(value);
const unique = values => new Set(values).size === values.length;
const assertExactFields = (value, fields, label) => {
  if (!isRecord(value) || Object.keys(value).length !== fields.length
    || fields.some(field => !Object.hasOwn(value, field))) {
    throw new TypeError(`${label} 必须是闭字段对象`);
  }
};

const parseReport = (reportJson) => {
  if (typeof reportJson !== 'string' || Buffer.byteLength(reportJson, 'utf8') > MAX_REPORT_BYTES) {
    throw new TypeError('reportJson 必须是至多 128 KiB 的 JSON 字符串');
  }
  let report;
  try { report = JSON.parse(reportJson); } catch { throw new TypeError('reportJson 不是合法 JSON'); }
  if (reportJson !== JSON.stringify(report)) throw new TypeError('reportJson 必须使用精确紧凑 JSON 编码');
  assertExactFields(report, EXACT_FIELDS.report, 'runtime probe report');
  for (const field of ['contract', 'bindings', 'execution', 'runtime', 'snapshot', 'result']) {
    assertExactFields(report[field], EXACT_FIELDS[field], `runtime probe report.${field}`);
  }
  assertExactFields(report.bindings.workloadImages, EXACT_FIELDS.workloadImages, 'runtime probe workloadImages');
  if (!Array.isArray(report.workloads) || report.workloads.length !== WORKLOAD_ROLES.length) {
    throw new TypeError('runtime probe workloads 必须固定为三个角色');
  }
  report.workloads.forEach((workload, index) => {
    assertExactFields(workload, EXACT_FIELDS.workload, `runtime probe workload ${index}`);
  });
  return report;
};

const validateBaseFields = (report, expectedBindings) => {
  assertExactFields(expectedBindings, EXACT_FIELDS.bindings, 'expectedBindings');
  assertExactFields(expectedBindings.workloadImages, EXACT_FIELDS.workloadImages, 'expected workloadImages');
  const bindingDigests = EXACT_FIELDS.bindings
    .filter(field => field !== 'workloadImages')
    .map(field => report.bindings[field]);
  if (!bindingDigests.every(value => SHA256_PATTERN.test(value))
    || !WORKLOAD_ROLES.every(role => SHA256_PATTERN.test(report.bindings.workloadImages[role]))) {
    throw new TypeError('runtime probe bindings 非法');
  }
  if (JSON.stringify(report.bindings) !== JSON.stringify(expectedBindings)) {
    throw new TypeError('runtime probe 与 host expectedBindings 不匹配');
  }
  report.workloads.forEach((workload, index) => {
    if (workload.role !== WORKLOAD_ROLES[index]
      || !Number.isSafeInteger(workload.uid) || workload.uid <= 0
      || workload.imageSha256 !== report.bindings.workloadImages[workload.role]
      || ![workload.pidNamespaceSha256, workload.userNamespaceSha256,
        workload.ipcNamespaceSha256, workload.mountNamespaceSha256,
        workload.networkNamespaceSha256].every(isNullableSha256)
      || ![workload.privileged, workload.noNewPrivileges, workload.readOnlyRootFs,
        workload.hostPid, workload.hostNetwork, workload.dockerSocket,
        workload.hostProc].every(isNullableBoolean)
      || workload.capabilities !== null
        && (!Array.isArray(workload.capabilities)
          || !workload.capabilities.every(value => SAFE_ID_PATTERN.test(value)))) {
      throw new TypeError(`runtime probe workload 基础字段非法: ${workload.role}`);
    }
  });
  if (!Array.isArray(report.snapshot.mountedRoles)
    || !report.snapshot.mountedRoles.every(value => WORKLOAD_ROLES.includes(value))
    || !SHA256_PATTERN.test(report.snapshot.digestBefore)
    || !SHA256_PATTERN.test(report.snapshot.digestAfter)
    || !isNullableBoolean(report.snapshot.writeAttemptsDenied)
    || !Array.isArray(report.result.failures)
    || !report.result.failures.every(value => SAFE_ID_PATTERN.test(value))) {
    throw new TypeError('runtime probe snapshot 或 result 基础字段非法');
  }
};

const observedNamespaceValues = (workloads, field) => workloads.map(workload => workload[field]);
const hasUnobservedWorkloadFields = workload => [
  workload.pidNamespaceSha256, workload.userNamespaceSha256, workload.ipcNamespaceSha256,
  workload.mountNamespaceSha256, workload.networkNamespaceSha256, workload.privileged,
  workload.noNewPrivileges, workload.readOnlyRootFs, workload.hostPid, workload.hostNetwork,
  workload.dockerSocket, workload.hostProc, workload.capabilities,
].every(value => value === null);

export const verifyCodexExternalControllerRuntimeProbeReport = ({ reportJson, expectedBindings }) => {
  const report = parseReport(reportJson);
  validateBaseFields(report, expectedBindings);
  const { contract, execution, runtime, workloads, snapshot, result } = report;
  const failures = [];
  if (report.schemaVersion !== 1 || report.reportType !== 'codex-fake-sentinel-runtime-probe'
    || contract.id !== CODEX_EXTERNAL_CONTROLLER_RUNTIME_PROBE.id
    || contract.version !== CODEX_EXTERNAL_CONTROLLER_RUNTIME_PROBE.version
    || contract.evidenceScope !== 'component-only'
    || contract.coverage !== CODEX_EXTERNAL_CONTROLLER_RUNTIME_PROBE.coverage
    || contract.producer !== 'project-plugin-installed-copy-unverified') failures.push('contract-boundary-invalid');
  if (execution.origin !== 'project-plugin-installed-copy-unverified' || execution.realCodexSpawns !== 0
    || execution.modelInvocations !== 0 || execution.credentialMaterialPresent !== false
    || execution.candidateGenerated !== false || execution.automaticLedgerWrites !== false
    || execution.retryCount !== 0 || execution.externalNetworkConnections !== 0) {
    failures.push('execution-boundary-invalid');
  }
  if (runtime.kind !== 'docker' || runtime.pullPolicy !== 'never'
    || runtime.evidenceOrigin !== 'self-reported-unverified'
    || runtime.eciStatus !== 'unverified'
    || ![runtime.clientAvailable, runtime.serverAvailable, runtime.imagePresent]
      .every(value => typeof value === 'boolean')) failures.push('runtime-boundary-invalid');
  if (!unique(workloads.map(workload => workload.uid))) failures.push('uid-not-isolated');
  const attempted = execution.runtimeAttempted === true;
  if (attempted) {
    if (!runtime.clientAvailable || !runtime.serverAvailable || !runtime.imagePresent
      || !workloads.every(workload => workload.attempted === true)) failures.push('runtime-observation-incomplete');
    for (const field of ['pidNamespaceSha256', 'ipcNamespaceSha256', 'mountNamespaceSha256', 'networkNamespaceSha256']) {
      const values = observedNamespaceValues(workloads, field);
      if (!values.every(value => SHA256_PATTERN.test(value)) || !unique(values)) {
        failures.push('namespace-not-isolated');
      }
    }
  } else if (execution.runtimeAttempted !== false
    || workloads.some(workload => workload.attempted !== false || !hasUnobservedWorkloadFields(workload))) {
    failures.push('runtime-observation-invalid');
  }
  workloads.forEach((workload) => {
    const expectsSnapshot = SNAPSHOT_ROLES.includes(workload.role);
    if (workload.authenticationRoot !== 'empty'
      || workload.snapshotAccess !== (expectsSnapshot ? 'read-only' : 'absent')
      || workload.foreignCanaryAccess !== (attempted ? 'denied' : 'not-run')) {
      failures.push('workload-boundary-invalid');
    }
    if (attempted && (workload.privileged !== false || workload.noNewPrivileges !== true
      || workload.readOnlyRootFs !== true || workload.hostPid !== false
      || workload.hostNetwork !== false || workload.dockerSocket !== false
      || workload.hostProc !== false || !Array.isArray(workload.capabilities)
      || workload.capabilities.length !== 0)) failures.push('unsafe-runtime-capability');
  });
  const expectedMountedRoles = attempted ? SNAPSHOT_ROLES : [];
  if (JSON.stringify(snapshot.mountedRoles) !== JSON.stringify(expectedMountedRoles)
    || snapshot.digestBefore !== report.bindings.snapshotSha256
    || snapshot.digestAfter !== report.bindings.snapshotSha256
    || snapshot.writeAttemptsDenied !== (attempted ? true : null)
    || snapshot.liveCheckoutMounted !== false || snapshot.ledgerFilesPresent !== false) {
    failures.push('snapshot-boundary-invalid');
  }
  if (execution.cleanupComplete !== true) failures.push('cleanup-incomplete');
  if (result.runtimeIsolationVerified !== false || result.controllerIsolationVerified !== false
    || result.userNamespaceVerified !== false || result.signerVerified !== false
    || result.trustedSigners !== 0 || result.topologyComplete !== false
    || result.outcomeEligible !== false || result.confirmedCoverageEligible !== false) {
    failures.push('claim-boundary-invalid');
  }
  const expectedStatus = attempted ? 'passed-subset' : 'not-run';
  if (result.status !== expectedStatus || result.runtimeProbeObserved !== attempted
    || attempted !== workloads.every(workload => workload.attempted)
    || (attempted ? result.failures.length !== 0 : result.failures.length === 0)) {
    failures.push('status-claim-invalid');
  }
  const uniqueFailures = [...new Set(failures)];
  return Object.freeze({
    schemaVersion: 1,
    reportType: 'codex-external-controller-runtime-probe-verification',
    probe: CODEX_EXTERNAL_CONTROLLER_RUNTIME_PROBE,
    ok: uniqueFailures.length === 0,
    verificationStatus: uniqueFailures.length > 0
      ? 'rejected'
      : (attempted ? 'component-subset-observed' : 'runtime-not-observed'),
    evidenceScope: 'component-only',
    coverage: CODEX_EXTERNAL_CONTROLLER_RUNTIME_PROBE.coverage,
    captureOrigin: 'personal-plugin-self-report-unverified',
    runtimeProbeObserved: uniqueFailures.length === 0 && attempted,
    runtimeIsolationVerified: false,
    controllerIsolationVerified: false,
    userNamespaceVerified: false,
    signerVerified: false,
    trustedSigners: 0,
    outcomeEligible: false,
    confirmedCoverageEligible: false,
    modelInvoked: false,
    credentialMaterialObserved: false,
    automaticLedgerWrites: false,
    reportSha256: createHash('sha256').update(reportJson).digest('hex'),
    failures: uniqueFailures,
  });
};
