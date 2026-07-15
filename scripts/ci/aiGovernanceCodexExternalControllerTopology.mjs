import { createHash } from 'node:crypto';

export const CODEX_EXTERNAL_CONTROLLER_TOPOLOGY = Object.freeze({
  id: 'codex-external-controller-topology',
  version: '1.0.0',
  caseId: 'codex-external-controller-topology-boundary',
});

const MAX_PLAN_BYTES = 64 * 1024;
const SHA256_PATTERN = /^[0-9a-f]{64}$/;
const SAFE_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]{0,99}$/;
const WORKLOAD_ROLES = Object.freeze([
  'controller', 'codex', 'mcp', 'validation', 'sanitizer', 'signer',
]);
const REQUIRED_TOOL = 'ai_governance_scorecard';
const REQUIRED_RESULT_PATH = 'maturityScorecard.nextFocus.id';
const EXACT_FIELDS = Object.freeze({
  plan: ['schemaVersion', 'contract', 'execution', 'bindings', 'workloads', 'mcpFacade', 'attestation'],
  contract: ['id', 'version', 'evidenceScope', 'executable'],
  execution: [
    'mode', 'modelInvocations', 'credentialMaterialPresent', 'automaticLedgerWrites',
    'codexSpawnLimit', 'retryLimit',
  ],
  bindings: [
    'modelId', 'codexBinarySha256', 'promptSha256', 'snapshotSha256',
    'controllerBundleSha256', 'bridgeSha256', 'policySha256', 'trialNonceSha256',
  ],
  workloads: WORKLOAD_ROLES,
  workload: [
    'role', 'trustDomain', 'uid', 'pidNamespace', 'modelCredentialAccess', 'repositoryAccess',
    'snapshotSha256', 'networkPolicy', 'userNamespace', 'ipcNamespace', 'authenticationRoot',
    'sharedWritableStorage', 'privileged', 'noNewPrivileges', 'readOnlyRootFs', 'hostPid',
    'hostNetwork', 'dockerSocket', 'hostProc', 'capabilities', 'imageSha256',
  ],
  mcpFacade: [
    'ownerWorkload', 'serverId', 'transport', 'required', 'enabledTools', 'resultPaths',
    'authMode', 'modelCredentialForwarding', 'snapshotSha256', 'serverImageSha256',
  ],
  attestation: [
    'sanitizerWorkload', 'signerWorkload', 'identityPolicy', 'keyMaterialInCheckout',
    'subjectBindings', 'verified',
  ],
});
const EXPECTED = Object.freeze({
  modelCredentialAccess: Object.freeze({
    controller: 'none', codex: 'single-use-proxy', mcp: 'none', validation: 'none',
    sanitizer: 'none', signer: 'none',
  }),
  repositoryAccess: Object.freeze({
    controller: 'none', codex: 'none', mcp: 'read-only-snapshot',
    validation: 'read-only-snapshot', sanitizer: 'none', signer: 'none',
  }),
  networkPolicy: Object.freeze({
    controller: 'control-plane-only', codex: 'openai-and-mcp-only', mcp: 'controller-ingress-only',
    validation: 'none', sanitizer: 'none', signer: 'attestation-service-only',
  }),
  authenticationRoot: Object.freeze({
    controller: 'none', codex: 'empty', mcp: 'empty', validation: 'empty',
    sanitizer: 'none', signer: 'none',
  }),
});
const isRecord = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const assertExactFields = (value, fields, label) => {
  if (!isRecord(value) || Object.keys(value).length !== fields.length
    || fields.some(field => !Object.hasOwn(value, field))) {
    throw new TypeError(`${label} 必须是闭字段对象`);
  }
};
const isSafeId = value => typeof value === 'string' && SAFE_ID_PATTERN.test(value);
const unique = values => new Set(values).size === values.length;

const parsePlan = (planJson) => {
  if (typeof planJson !== 'string' || Buffer.byteLength(planJson, 'utf8') > MAX_PLAN_BYTES) {
    throw new TypeError('planJson 必须是至多 64 KiB 的 JSON 字符串');
  }
  let plan;
  try { plan = JSON.parse(planJson); } catch { throw new TypeError('planJson 不是合法 JSON'); }
  if (planJson !== JSON.stringify(plan)) throw new TypeError('planJson 必须使用精确紧凑 JSON 编码');
  assertExactFields(plan, EXACT_FIELDS.plan, 'topology plan');
  for (const field of ['contract', 'execution', 'bindings', 'workloads', 'mcpFacade', 'attestation']) {
    assertExactFields(plan[field], EXACT_FIELDS[field], `topology plan.${field}`);
  }
  for (const role of WORKLOAD_ROLES) {
    assertExactFields(plan.workloads[role], EXACT_FIELDS.workload, `topology plan.workloads.${role}`);
  }
  return plan;
};

const validateBaseFields = (plan, expectedBindings) => {
  const { bindings, workloads, mcpFacade, attestation } = plan;
  assertExactFields(expectedBindings, EXACT_FIELDS.bindings, 'expectedBindings');
  if (plan.schemaVersion !== 1
    || plan.contract.id !== CODEX_EXTERNAL_CONTROLLER_TOPOLOGY.id
    || plan.contract.version !== CODEX_EXTERNAL_CONTROLLER_TOPOLOGY.version
    || !isSafeId(bindings.modelId)
    || ![bindings.codexBinarySha256, bindings.promptSha256, bindings.snapshotSha256,
      bindings.controllerBundleSha256, bindings.bridgeSha256, bindings.policySha256,
      bindings.trialNonceSha256]
      .every(value => SHA256_PATTERN.test(value))) {
    throw new TypeError('topology plan 基础绑定非法');
  }
  if (JSON.stringify(bindings) !== JSON.stringify(expectedBindings)) {
    throw new TypeError('topology plan 与 host expectedBindings 不匹配');
  }
  for (const role of WORKLOAD_ROLES) {
    const workload = workloads[role];
    if (workload.role !== role || !isSafeId(workload.trustDomain) || !isSafeId(workload.pidNamespace)
      || !isSafeId(workload.userNamespace) || !isSafeId(workload.ipcNamespace)
      || !Number.isSafeInteger(workload.uid) || workload.uid <= 0
      || !SHA256_PATTERN.test(workload.imageSha256)
      || !Array.isArray(workload.capabilities) || !workload.capabilities.every(isSafeId)
      || workload.snapshotSha256 !== null && !SHA256_PATTERN.test(workload.snapshotSha256)) {
      throw new TypeError(`topology plan workload 基础字段非法: ${role}`);
    }
  }
  if (!Array.isArray(mcpFacade.enabledTools) || !mcpFacade.enabledTools.every(isSafeId)
    || !Array.isArray(mcpFacade.resultPaths) || !mcpFacade.resultPaths.every(isSafeId)
    || !SHA256_PATTERN.test(mcpFacade.snapshotSha256)
    || !SHA256_PATTERN.test(mcpFacade.serverImageSha256)
    || !Array.isArray(attestation.subjectBindings) || !attestation.subjectBindings.every(isSafeId)) {
    throw new TypeError('topology plan facade 或 attestation 基础字段非法');
  }
};

export const verifyCodexExternalControllerTopologyPlan = ({ planJson, expectedBindings }) => {
  const plan = parsePlan(planJson);
  validateBaseFields(plan, expectedBindings);
  const { contract, execution, bindings, workloads, mcpFacade, attestation } = plan;
  const failures = [];
  if (contract.evidenceScope !== 'component-only' || contract.executable !== false
    || execution.mode !== 'dry-run' || execution.modelInvocations !== 0
    || execution.credentialMaterialPresent !== false || execution.automaticLedgerWrites !== false) {
    failures.push('execution-boundary-invalid');
  }
  if (execution.codexSpawnLimit !== 1 || execution.retryLimit !== 0) failures.push('spawn-policy-invalid');
  if (!unique(WORKLOAD_ROLES.map(role => workloads[role].trustDomain))) failures.push('trust-domain-not-isolated');
  if (!unique(WORKLOAD_ROLES.map(role => workloads[role].uid))) failures.push('uid-not-isolated');
  if (!unique(WORKLOAD_ROLES.map(role => workloads[role].pidNamespace))) failures.push('pid-namespace-not-isolated');
  if (!unique(WORKLOAD_ROLES.map(role => workloads[role].userNamespace))) failures.push('user-namespace-not-isolated');
  if (!unique(WORKLOAD_ROLES.map(role => workloads[role].ipcNamespace))) failures.push('ipc-namespace-not-isolated');
  for (const role of WORKLOAD_ROLES) {
    const workload = workloads[role];
    if (workload.modelCredentialAccess !== EXPECTED.modelCredentialAccess[role]) {
      failures.push('model-credential-boundary-invalid');
    }
    if (workload.repositoryAccess !== EXPECTED.repositoryAccess[role]
      || workload.snapshotSha256 !== (['mcp', 'validation'].includes(role) ? bindings.snapshotSha256 : null)) {
      failures.push('repository-boundary-invalid');
    }
    if (workload.networkPolicy !== EXPECTED.networkPolicy[role]) failures.push('network-policy-invalid');
    if (workload.authenticationRoot !== EXPECTED.authenticationRoot[role]) failures.push('authentication-root-invalid');
    if (workload.sharedWritableStorage !== false || workload.privileged !== false
      || workload.noNewPrivileges !== true || workload.readOnlyRootFs !== true
      || workload.hostPid !== false || workload.hostNetwork !== false || workload.dockerSocket !== false
      || workload.hostProc !== false || workload.capabilities.length !== 0) {
      failures.push('unsafe-runtime-capability');
    }
  }
  if (mcpFacade.ownerWorkload !== 'mcp' || mcpFacade.serverId !== 'jsonutils-governance'
    || mcpFacade.transport !== 'streamable-http' || mcpFacade.required !== true
    || mcpFacade.authMode !== 'single-use-controller-capability'
    || mcpFacade.modelCredentialForwarding !== false
    || mcpFacade.snapshotSha256 !== bindings.snapshotSha256
    || mcpFacade.serverImageSha256 !== workloads.mcp.imageSha256
    || bindings.bridgeSha256 !== mcpFacade.serverImageSha256
    || JSON.stringify(mcpFacade.enabledTools) !== JSON.stringify([REQUIRED_TOOL])
    || JSON.stringify(mcpFacade.resultPaths) !== JSON.stringify([REQUIRED_RESULT_PATH])) {
    failures.push('mcp-facade-boundary-invalid');
  }
  if (attestation.sanitizerWorkload !== 'sanitizer' || attestation.signerWorkload !== 'signer'
    || attestation.identityPolicy !== 'external-required'
    || attestation.keyMaterialInCheckout !== false || attestation.verified !== false
    || JSON.stringify(attestation.subjectBindings) !== JSON.stringify([
      'plan-sha256', 'sanitized-candidate-sha256', 'snapshot-sha256', 'binary-sha256',
    ])) failures.push('attestation-boundary-invalid');
  const uniqueFailures = [...new Set(failures)];
  return Object.freeze({
    schemaVersion: 1,
    reportType: 'codex-external-controller-topology-verification',
    topology: CODEX_EXTERNAL_CONTROLLER_TOPOLOGY,
    ok: uniqueFailures.length === 0,
    verificationStatus: uniqueFailures.length === 0 ? 'component-contract-satisfied' : 'rejected',
    evidenceScope: 'component-only',
    outcomeEligible: false,
    confirmedCoverageEligible: false,
    captureOrigin: 'external-json-unverified',
    executionEnabled: false,
    modelInvoked: false,
    credentialMaterialObserved: false,
    candidateGenerated: false,
    automaticLedgerWrites: false,
    runtimeIsolationVerified: false,
    signerVerified: false,
    trustedSigners: 0,
    planSha256: createHash('sha256').update(planJson).digest('hex'),
    failures: uniqueFailures,
  });
};
