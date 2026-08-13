export const CODEX_EXTERNAL_CONTROLLER_RUNTIME_PROBE = Object.freeze({
  id: 'codex-external-controller-runtime-probe',
  version: '1.1.0',
  caseId: 'codex-external-controller-runtime-probe-boundary',
  coverage: 'credential-snapshot-subset',
});

const MAX_REPORT_BYTES = 128 * 1024;
const SHA256_PATTERN = /^[0-9a-f]{64}$/;
const SAFE_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]{0,99}$/;
export const RUNTIME_PROBE_WORKLOAD_ROLES = Object.freeze([
  'codex-sentinel', 'mcp-sentinel', 'validation-sentinel',
]);
export const RUNTIME_PROBE_SNAPSHOT_ROLES = Object.freeze(['mcp-sentinel', 'validation-sentinel']);
const EXACT_FIELDS = Object.freeze({
  report: ['schemaVersion', 'reportType', 'contract', 'bindings', 'execution', 'runtime', 'workloads', 'snapshot', 'result'],
  contract: ['id', 'version', 'evidenceScope', 'coverage', 'producer'],
  bindings: [
    'topologyPlanSha256', 'controllerBundleSha256', 'launcherBundleSha256', 'policySha256',
    'snapshotSha256', 'trialNonceSha256', 'runtimeBinarySha256', 'workloadImages',
  ],
  workloadImages: RUNTIME_PROBE_WORKLOAD_ROLES,
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
export const isRuntimeProbeSha256 = value => typeof value === 'string' && SHA256_PATTERN.test(value);
const isNullableSha256 = value => value === null || isRuntimeProbeSha256(value);
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
  if (!Array.isArray(report.workloads) || report.workloads.length !== RUNTIME_PROBE_WORKLOAD_ROLES.length) {
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
  if (!bindingDigests.every(isRuntimeProbeSha256)
    || !RUNTIME_PROBE_WORKLOAD_ROLES.every(role => isRuntimeProbeSha256(report.bindings.workloadImages[role]))) {
    throw new TypeError('runtime probe bindings 非法');
  }
  if (JSON.stringify(report.bindings) !== JSON.stringify(expectedBindings)) {
    throw new TypeError('runtime probe 与 host expectedBindings 不匹配');
  }
  report.workloads.forEach((workload, index) => {
    if (workload.role !== RUNTIME_PROBE_WORKLOAD_ROLES[index]
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
    || !report.snapshot.mountedRoles.every(value => RUNTIME_PROBE_WORKLOAD_ROLES.includes(value))
    || !isRuntimeProbeSha256(report.snapshot.digestBefore)
    || !isRuntimeProbeSha256(report.snapshot.digestAfter)
    || !isNullableBoolean(report.snapshot.writeAttemptsDenied)
    || !Array.isArray(report.result.failures)
    || !report.result.failures.every(value => SAFE_ID_PATTERN.test(value))) {
    throw new TypeError('runtime probe snapshot 或 result 基础字段非法');
  }
};

export const parseCodexExternalControllerRuntimeProbeReport = ({ reportJson, expectedBindings }) => {
  const report = parseReport(reportJson);
  validateBaseFields(report, expectedBindings);
  return report;
};
