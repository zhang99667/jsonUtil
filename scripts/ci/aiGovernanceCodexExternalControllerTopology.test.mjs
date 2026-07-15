import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  CODEX_EXTERNAL_CONTROLLER_TOPOLOGY,
  verifyCodexExternalControllerTopologyPlan,
} from './aiGovernanceCodexExternalControllerTopology.mjs';

const digest = character => character.repeat(64);
const buildWorkload = (role, overrides = {}) => ({
  role,
  trustDomain: `${role}-trust`,
  uid: {
    controller: 11001, codex: 11002, mcp: 11003, validation: 11004, sanitizer: 11005, signer: 11006,
  }[role],
  pidNamespace: `${role}-pid`,
  userNamespace: `${role}-user`,
  ipcNamespace: `${role}-ipc`,
  modelCredentialAccess: role === 'codex' ? 'single-use-proxy' : 'none',
  repositoryAccess: ['mcp', 'validation'].includes(role) ? 'read-only-snapshot' : 'none',
  snapshotSha256: ['mcp', 'validation'].includes(role) ? digest('c') : null,
  networkPolicy: {
    controller: 'control-plane-only', codex: 'openai-and-mcp-only', mcp: 'controller-ingress-only',
    validation: 'none', sanitizer: 'none', signer: 'attestation-service-only',
  }[role],
  authenticationRoot: ['codex', 'mcp', 'validation'].includes(role) ? 'empty' : 'none',
  sharedWritableStorage: false,
  privileged: false,
  noNewPrivileges: true,
  readOnlyRootFs: true,
  hostPid: false,
  hostNetwork: false,
  dockerSocket: false,
  hostProc: false,
  capabilities: [],
  imageSha256: digest({
    controller: '1', codex: '2', mcp: '3', validation: '4', sanitizer: '5', signer: '6',
  }[role]),
  ...overrides,
});

const buildPlan = () => ({
  schemaVersion: 1,
  contract: {
    id: CODEX_EXTERNAL_CONTROLLER_TOPOLOGY.id,
    version: CODEX_EXTERNAL_CONTROLLER_TOPOLOGY.version,
    evidenceScope: 'component-only',
    executable: false,
  },
  execution: {
    mode: 'dry-run',
    modelInvocations: 0,
    credentialMaterialPresent: false,
    automaticLedgerWrites: false,
    codexSpawnLimit: 1,
    retryLimit: 0,
  },
  bindings: {
    modelId: 'gpt-5.4',
    codexBinarySha256: digest('a'),
    promptSha256: digest('b'),
    snapshotSha256: digest('c'),
    controllerBundleSha256: digest('1'),
    bridgeSha256: digest('3'),
    policySha256: digest('d'),
    trialNonceSha256: digest('e'),
  },
  workloads: {
    controller: buildWorkload('controller'),
    codex: buildWorkload('codex'),
    mcp: buildWorkload('mcp'),
    validation: buildWorkload('validation'),
    sanitizer: buildWorkload('sanitizer'),
    signer: buildWorkload('signer'),
  },
  mcpFacade: {
    ownerWorkload: 'mcp',
    serverId: 'jsonutils-governance',
    transport: 'streamable-http',
    required: true,
    enabledTools: ['ai_governance_scorecard'],
    resultPaths: ['maturityScorecard.nextFocus.id'],
    authMode: 'single-use-controller-capability',
    modelCredentialForwarding: false,
    snapshotSha256: digest('c'),
    serverImageSha256: digest('3'),
  },
  attestation: {
    sanitizerWorkload: 'sanitizer',
    signerWorkload: 'signer',
    identityPolicy: 'external-required',
    keyMaterialInCheckout: false,
    subjectBindings: [
      'plan-sha256', 'sanitized-candidate-sha256', 'snapshot-sha256', 'binary-sha256',
    ],
    verified: false,
  },
});

const verify = (plan, expectedBindings = buildPlan().bindings) => verifyCodexExternalControllerTopologyPlan({
  planJson: JSON.stringify(plan),
  expectedBindings,
});

test('外部 controller 拓扑计划只得到 component contract，不冒充运行时证明', () => {
  const result = verify(buildPlan());
  assert.equal(result.ok, true);
  assert.equal(result.evidenceScope, 'component-only');
  assert.equal(result.outcomeEligible, false);
  assert.equal(result.executionEnabled, false);
  assert.equal(result.modelInvoked, false);
  assert.equal(result.credentialMaterialObserved, false);
  assert.equal(result.runtimeIsolationVerified, false);
  assert.equal(result.signerVerified, false);
  assert.match(result.planSha256, /^[0-9a-f]{64}$/);
});

test('外部 controller 拓扑拒绝额外字段和可执行声明', () => {
  const plan = buildPlan();
  plan.command = 'codex exec';
  assert.throws(() => verify(plan), /闭字段对象/);
  delete plan.command;
  plan.contract.executable = true;
  plan.execution.mode = 'live';
  assert.deepEqual(verify(plan).failures, ['execution-boundary-invalid']);
});

test('外部 controller 拓扑拒绝共享 UID 与 namespace/trust domain', () => {
  const plan = buildPlan();
  plan.workloads.mcp.uid = plan.workloads.codex.uid;
  plan.workloads.validation.pidNamespace = plan.workloads.codex.pidNamespace;
  plan.workloads.validation.userNamespace = plan.workloads.codex.userNamespace;
  plan.workloads.sanitizer.ipcNamespace = plan.workloads.codex.ipcNamespace;
  plan.workloads.signer.trustDomain = plan.workloads.controller.trustDomain;
  assert.deepEqual(verify(plan).failures, [
    'trust-domain-not-isolated', 'uid-not-isolated', 'pid-namespace-not-isolated',
    'user-namespace-not-isolated', 'ipc-namespace-not-isolated',
  ]);
});

test('外部 controller 拓扑拒绝模型凭据转发、checkout 暴露和宿主能力', () => {
  const plan = buildPlan();
  plan.workloads.mcp.modelCredentialAccess = 'single-use-proxy';
  plan.workloads.codex.repositoryAccess = 'read-only-snapshot';
  plan.workloads.codex.snapshotSha256 = digest('c');
  plan.workloads.validation.privileged = true;
  plan.workloads.signer.dockerSocket = true;
  plan.workloads.sanitizer.capabilities = ['SYS_PTRACE'];
  assert.deepEqual(verify(plan).failures, [
    'repository-boundary-invalid', 'model-credential-boundary-invalid', 'unsafe-runtime-capability',
  ]);
});

test('外部 controller 拓扑要求精确紧凑 JSON 并绑定 host expectedBindings', () => {
  const plan = buildPlan();
  assert.throws(
    () => verifyCodexExternalControllerTopologyPlan({
      planJson: `${JSON.stringify(plan)}\n`, expectedBindings: plan.bindings,
    }),
    /精确紧凑 JSON/,
  );
  plan.bindings.promptSha256 = digest('f');
  assert.throws(() => verify(plan), /host expectedBindings 不匹配/);
});

test('外部 controller 拓扑拒绝 MCP 扩权、重试和仓内 signer 自证', () => {
  const plan = buildPlan();
  plan.execution.retryLimit = 1;
  plan.mcpFacade.enabledTools.push('ai_governance_context');
  plan.mcpFacade.modelCredentialForwarding = true;
  plan.attestation.identityPolicy = 'repository-local';
  plan.attestation.verified = true;
  assert.deepEqual(verify(plan).failures, [
    'spawn-policy-invalid', 'mcp-facade-boundary-invalid', 'attestation-boundary-invalid',
  ]);
});
