import { createHash } from 'node:crypto';

import { collectEvolutionSensitiveFieldFailures, isEvolutionRecord } from './aiGovernanceEvolutionEvalContract.mjs';

const SHA256_PATTERN = /^[0-9a-f]{64}$/;
const REVISION_PATTERN = /^worktree-[0-9a-f]{64}$/;
const BLIND_ALIAS_PATTERN = /^canary-[0-9a-f]{32}$/;
const PACKET_VERSION = '1.0.0';
const CASE_ID = 'mcp-project-registration-discovery';
const EXPERIMENT_ID = 'mcp-project-registration-canary';
export const REGISTRATION_CANARY_TRIAL_BINDINGS = Object.freeze({
  'mcp-registration-p1-baseline': { pair: 1, arm: 'baseline', executionOrdinal: 1 },
  'mcp-registration-p1-candidate': { pair: 1, arm: 'candidate', executionOrdinal: 2 },
  'mcp-registration-p2-candidate': { pair: 2, arm: 'candidate', executionOrdinal: 3 },
  'mcp-registration-p2-baseline': { pair: 2, arm: 'baseline', executionOrdinal: 4 },
  'mcp-registration-p3-baseline': { pair: 3, arm: 'baseline', executionOrdinal: 5 },
  'mcp-registration-p3-candidate': { pair: 3, arm: 'candidate', executionOrdinal: 6 },
});
const PRIVACY = Object.freeze({
  sourceUserContentStored: false, reasoningStored: false, toolPayloadStored: false,
  authMaterialStored: false, userConfigStored: false, absoluteUserPathStored: false,
});
const CLAIMS = Object.freeze({
  modelInvoked: false, executionObserved: false, automaticLedgerWrites: false, outcomeEligible: false,
});

export const REGISTRATION_CANARY_PACKET = Object.freeze({
  id: 'mcp-registration-canary-launch-packet', version: PACKET_VERSION,
  caseId: CASE_ID, experimentId: EXPERIMENT_ID,
});

const hash = value => createHash('sha256').update(value).digest('hex');
export const hashRegistrationCanaryPacketValue = (domain, value) => hash(JSON.stringify({ domain, value }));
const hashPacket = hashRegistrationCanaryPacketValue;
const exactFields = (value, fields, label) => {
  if (!isEvolutionRecord(value)) return [`${label} 必须是对象`];
  const actual = Object.keys(value).sort();
  const expected = [...fields].sort();
  return JSON.stringify(actual) === JSON.stringify(expected) ? [] : [`${label} 必须是闭字段对象`];
};
const falseOnly = (value, fields, label) => {
  const failures = exactFields(value, fields, label);
  if (failures.length > 0) return failures;
  return fields.filter(field => value[field] !== false).map(field => `${label}.${field} 必须为 false`);
};
const descriptorFailures = (value, label) => [
  ...exactFields(value, ['path', 'sha256'], label),
  ...(!isEvolutionRecord(value) || typeof value.path !== 'string' || value.path.startsWith('/') || value.path.includes('..')
    ? [`${label}.path 必须是仓库相对路径`] : []),
  ...(!isEvolutionRecord(value) || !SHA256_PATTERN.test(value.sha256 ?? '') ? [`${label}.sha256 非法`] : []),
];
const checkpointFailures = (value, label) => {
  const failures = exactFields(value, ['path', 'records', 'headSequence', 'headSha256', 'fileSha256'], label);
  if (!isEvolutionRecord(value)) return failures;
  if (!Number.isSafeInteger(value.records) || value.records < 0) failures.push(`${label}.records 非法`);
  if (value.records === 0 ? value.headSequence !== null || value.headSha256 !== null
    : value.headSequence !== value.records || !SHA256_PATTERN.test(value.headSha256 ?? '')) {
    failures.push(`${label} head 与 records 不一致`);
  }
  if (!SHA256_PATTERN.test(value.fileSha256 ?? '')) failures.push(`${label}.fileSha256 非法`);
  return failures;
};

export const buildRegistrationCanaryPacketBundle = ({
  corpusVersion, manifestVersion, caseItem, experiment, trialId, runNonce,
  environmentSha256, bindings,
}) => {
  if (!SHA256_PATTERN.test(runNonce ?? '') || !SHA256_PATTERN.test(environmentSha256 ?? '')) {
    throw new TypeError('run nonce 与 environment digest 必须是 64 位小写 SHA-256');
  }
  if (caseItem?.id !== CASE_ID || experiment?.id !== EXPERIMENT_ID) throw new TypeError('case/experiment 绑定非法');
  if (experiment.caseRef?.caseVersion !== caseItem.caseVersion
    || experiment.caseRef?.subjectVersion !== caseItem.subject?.version) throw new TypeError('experiment caseRef 已漂移');
  const trial = experiment.design?.trialPlan?.find(item => item.id === trialId);
  if (!trial || trial.status !== 'planned' || trial.receiptId !== null) throw new TypeError('trial 必须是当前 planned 白名单项');
  if (experiment.execution?.status !== 'blocked' || experiment.execution?.reasonCode !== 'new-task-required') {
    throw new TypeError('launch packet v1 只接受 blocked/new-task-required experiment');
  }
  const expectedTrial = REGISTRATION_CANARY_TRIAL_BINDINGS[trial.id];
  if (!expectedTrial || trial.pair !== expectedTrial.pair || trial.arm !== expectedTrial.arm) throw new TypeError('trial pair/arm 与固定计划不匹配');
  const arm = experiment.design.arms.find(item => item.id === trial.arm);
  const ordinal = expectedTrial.executionOrdinal;
  if (!arm || !REVISION_PATTERN.test(bindings?.fixtureRevision ?? '')) throw new TypeError('trial arm/order/fixture 非法');
  const blindTrialAlias = `canary-${hashPacket('jsonutils.registration-canary.blind-alias/v1', {
    runNonce, trialId, fixtureRevision: bindings.fixtureRevision, environmentSha256,
  }).slice(0, 32)}`;
  const state = { status: 'prepared', reasonCode: 'external-preflight-required' };
  const agent = {
    schemaVersion: 1, artifactType: 'ai-registration-canary-agent-packet', dataClass: 'redacted',
    packetVersion: PACKET_VERSION, blindTrialAlias, state,
    bindings: { fixtureRevision: bindings.fixtureRevision, environmentSha256 },
    input: { request: caseItem.input.request, context: caseItem.input.context },
    outputContract: {
      reportType: 'ai-registration-canary-observation',
      requiredFields: ['registrySurface', 'serverDiscovery', 'toolDiscovery', 'fallback', 'infrastructure'],
      forbiddenEvidenceSources: ['repository-stdio', 'plugin-cache-process', 'static-config', 'hook-direct-run'],
    },
    claims: { ...CLAIMS }, privacy: { ...PRIVACY },
  };
  const grader = {
    schemaVersion: 1, artifactType: 'ai-registration-canary-grader-packet', dataClass: 'redacted',
    packetVersion: PACKET_VERSION, blindTrialAlias, state,
    caseRef: { id: caseItem.id, caseVersion: caseItem.caseVersion, subjectVersion: caseItem.subject.version },
    expectedOutcome: structuredClone(caseItem.expectedOutcome), graders: structuredClone(caseItem.graders),
    rubricSha256: hashPacket('jsonutils.registration-canary.rubric/v1', {
      expectedOutcome: caseItem.expectedOutcome, graders: caseItem.graders,
    }),
    claims: { ...CLAIMS }, privacy: { ...PRIVACY },
  };
  const host = {
    schemaVersion: 1, artifactType: 'ai-registration-canary-host-packet', dataClass: 'redacted',
    packetVersion: PACKET_VERSION, blindTrialAlias, state,
    experimentRef: { id: experiment.id, manifestVersion, corpusVersion },
    trial: {
      id: trial.id, pair: trial.pair, arm: trial.arm, treatment: arm.treatment,
      executionOrdinal: ordinal, status: trial.status, receiptId: trial.receiptId,
    },
    treatment: {
      personalPluginExpectedEnabled: trial.arm === 'candidate',
      projectConfigExpectedPresent: true, currentTaskRegistryRequired: true,
    },
    bindings: structuredClone({ ...bindings, environmentSha256 }),
    lease: {
      keySha256: hashPacket('jsonutils.registration-canary.external-lease/v1', { runNonce, trialId }),
      externalLeaseRequired: true, externalLeaseAcquired: false, singleUse: true, retryWithSameTrialAllowed: false,
    },
    preflight: {
      freshTaskRequired: true, resumeAllowed: false, sameSessionAcrossArmsAllowed: false,
      armIsolationVerified: false, registryObserved: false, repositoryStdioAllowed: false,
      pluginCacheProcessAllowed: false, hookDirectRunAllowed: false, governanceCheckRequired: true,
    },
    projectionDigests: {
      agentSha256: hashPacket('jsonutils.registration-canary.agent-packet/v1', agent),
      graderSha256: hashPacket('jsonutils.registration-canary.grader-packet/v1', grader),
    },
    claims: { ...CLAIMS }, privacy: { ...PRIVACY },
  };
  const bundle = { agent, grader, host };
  const failures = collectRegistrationCanaryPacketFailures(bundle);
  if (failures.length > 0) throw new TypeError(failures.join('; '));
  return bundle;
};

export const collectRegistrationCanaryPacketFailures = (bundle) => {
  const failures = exactFields(bundle, ['agent', 'grader', 'host'], 'packet bundle');
  if (!isEvolutionRecord(bundle)) return failures;
  const { agent, grader, host } = bundle;
  failures.push(...exactFields(agent, ['schemaVersion', 'artifactType', 'dataClass', 'packetVersion', 'blindTrialAlias', 'state', 'bindings', 'input', 'outputContract', 'claims', 'privacy'], 'agent packet'));
  failures.push(...exactFields(grader, ['schemaVersion', 'artifactType', 'dataClass', 'packetVersion', 'blindTrialAlias', 'state', 'caseRef', 'expectedOutcome', 'graders', 'rubricSha256', 'claims', 'privacy'], 'grader packet'));
  failures.push(...exactFields(host, ['schemaVersion', 'artifactType', 'dataClass', 'packetVersion', 'blindTrialAlias', 'state', 'experimentRef', 'trial', 'treatment', 'bindings', 'lease', 'preflight', 'projectionDigests', 'claims', 'privacy'], 'host packet'));
  for (const [label, packet] of [['agent', agent], ['grader', grader], ['host', host]]) {
    if (!isEvolutionRecord(packet)) continue;
    if (packet.schemaVersion !== 1 || packet.dataClass !== 'redacted' || packet.packetVersion !== PACKET_VERSION
      || !BLIND_ALIAS_PATTERN.test(packet.blindTrialAlias ?? '') || packet.blindTrialAlias !== agent?.blindTrialAlias) failures.push(`${label} packet 基础绑定非法`);
    failures.push(...exactFields(packet.state, ['status', 'reasonCode'], `${label}.state`));
    if (packet.state?.status !== 'prepared' || packet.state?.reasonCode !== 'external-preflight-required') failures.push(`${label}.state 不得宣称 executed/pass`);
    failures.push(...falseOnly(packet.claims, Object.keys(CLAIMS), `${label}.claims`));
    failures.push(...falseOnly(packet.privacy, Object.keys(PRIVACY), `${label}.privacy`));
  }
  if (agent?.artifactType !== 'ai-registration-canary-agent-packet'
    || grader?.artifactType !== 'ai-registration-canary-grader-packet'
    || host?.artifactType !== 'ai-registration-canary-host-packet') failures.push('packet artifactType 非法');
  failures.push(...exactFields(agent?.bindings, ['fixtureRevision', 'environmentSha256'], 'agent.bindings'));
  if (!REVISION_PATTERN.test(agent?.bindings?.fixtureRevision ?? '') || !SHA256_PATTERN.test(agent?.bindings?.environmentSha256 ?? '')) failures.push('agent.bindings 非法');
  failures.push(...exactFields(agent?.input, ['request', 'context'], 'agent.input'));
  failures.push(...exactFields(agent?.outputContract, ['reportType', 'requiredFields', 'forbiddenEvidenceSources'], 'agent.outputContract'));
  if (agent?.outputContract?.reportType !== 'ai-registration-canary-observation'
    || JSON.stringify(agent?.outputContract?.requiredFields) !== JSON.stringify(['registrySurface', 'serverDiscovery', 'toolDiscovery', 'fallback', 'infrastructure'])
    || JSON.stringify(agent?.outputContract?.forbiddenEvidenceSources) !== JSON.stringify(['repository-stdio', 'plugin-cache-process', 'static-config', 'hook-direct-run'])) failures.push('agent.outputContract 非法');
  for (const forbidden of ['arm', 'treatment', 'personalPluginExpectedEnabled', 'expectedOutcome', 'graders', 'pair', 'trialId']) {
    if (JSON.stringify(agent).includes(`\"${forbidden}\"`)) failures.push(`agent packet 泄漏 ${forbidden}`);
  }
  for (const forbidden of ['arm', 'treatment', 'personalPluginExpectedEnabled', 'pair', 'trial']) {
    if (JSON.stringify(grader).includes(`\"${forbidden}\"`)) failures.push(`grader packet 泄漏 ${forbidden}`);
  }
  failures.push(...exactFields(grader?.caseRef, ['id', 'caseVersion', 'subjectVersion'], 'grader.caseRef'));
  if (grader?.caseRef?.id !== CASE_ID || !Number.isSafeInteger(grader?.caseRef?.caseVersion)
    || typeof grader?.caseRef?.subjectVersion !== 'string'
    || grader?.rubricSha256 !== hashPacket('jsonutils.registration-canary.rubric/v1', {
      expectedOutcome: grader?.expectedOutcome, graders: grader?.graders,
    })) failures.push('grader rubric/case 绑定非法');
  failures.push(...exactFields(host?.experimentRef, ['id', 'manifestVersion', 'corpusVersion'], 'host.experimentRef'));
  failures.push(...exactFields(host?.trial, ['id', 'pair', 'arm', 'treatment', 'executionOrdinal', 'status', 'receiptId'], 'host.trial'));
  failures.push(...exactFields(host?.treatment, ['personalPluginExpectedEnabled', 'projectConfigExpectedPresent', 'currentTaskRegistryRequired'], 'host.treatment'));
  failures.push(...exactFields(host?.bindings, ['fixtureRevision', 'environmentSha256', 'artifacts', 'ledgers'], 'host.bindings'));
  failures.push(...exactFields(host?.bindings?.artifacts, ['caseDescriptor', 'experimentDescriptor', 'projectMcp', 'projectHooks'], 'host.bindings.artifacts'));
  failures.push(...exactFields(host?.bindings?.ledgers, ['outcomes', 'receipts', 'feedback'], 'host.bindings.ledgers'));
  for (const key of ['caseDescriptor', 'experimentDescriptor', 'projectMcp', 'projectHooks']) failures.push(...descriptorFailures(host?.bindings?.artifacts?.[key], `host.bindings.artifacts.${key}`));
  for (const key of ['outcomes', 'receipts', 'feedback']) failures.push(...checkpointFailures(host?.bindings?.ledgers?.[key], `host.bindings.ledgers.${key}`));
  const expectedPaths = {
    caseDescriptor: 'evals/ai-governance/cases.json', experimentDescriptor: 'evals/ai-governance/experiments.json',
    projectMcp: '.mcp.json', projectHooks: '.codex/hooks.json', outcomes: 'evals/ai-governance/outcomes.jsonl',
    receipts: 'evals/ai-governance/trial-receipts.jsonl', feedback: 'evals/ai-governance/feedback-inbox.jsonl',
  };
  for (const [key, expectedPath] of Object.entries(expectedPaths)) {
    const group = ['outcomes', 'receipts', 'feedback'].includes(key) ? host?.bindings?.ledgers : host?.bindings?.artifacts;
    if (group?.[key]?.path !== expectedPath) failures.push(`host binding path ${key} 非法`);
  }
  if (host?.experimentRef?.id !== EXPERIMENT_ID || host?.bindings?.fixtureRevision !== agent?.bindings?.fixtureRevision
    || host?.bindings?.environmentSha256 !== agent?.bindings?.environmentSha256) failures.push('host/agent shared binding 漂移');
  const expectedTreatment = host?.trial?.arm === 'baseline' ? 'project-config-only'
    : host?.trial?.arm === 'candidate' ? 'project-plugin-registration' : null;
  if (host?.trial?.treatment !== expectedTreatment
    || host?.treatment?.personalPluginExpectedEnabled !== (host?.trial?.arm === 'candidate')
    || host?.treatment?.projectConfigExpectedPresent !== true || host?.treatment?.currentTaskRegistryRequired !== true) failures.push('host treatment 与 arm 污染');
  const expectedTrial = REGISTRATION_CANARY_TRIAL_BINDINGS[host?.trial?.id];
  if (host?.trial?.status !== 'planned' || host?.trial?.receiptId !== null || !expectedTrial
    || host?.trial?.executionOrdinal !== expectedTrial?.executionOrdinal
    || host?.trial?.pair !== expectedTrial?.pair || host?.trial?.arm !== expectedTrial?.arm) failures.push('host trial 不再可启动');
  failures.push(...exactFields(host?.lease, ['keySha256', 'externalLeaseRequired', 'externalLeaseAcquired', 'singleUse', 'retryWithSameTrialAllowed'], 'host.lease'));
  if (!SHA256_PATTERN.test(host?.lease?.keySha256 ?? '') || host?.lease?.externalLeaseRequired !== true
    || host?.lease?.externalLeaseAcquired !== false || host?.lease?.singleUse !== true
    || host?.lease?.retryWithSameTrialAllowed !== false) failures.push('host lease 不能自称已领取或允许同 trial 重试');
  failures.push(...exactFields(host?.preflight, ['freshTaskRequired', 'resumeAllowed', 'sameSessionAcrossArmsAllowed', 'armIsolationVerified', 'registryObserved', 'repositoryStdioAllowed', 'pluginCacheProcessAllowed', 'hookDirectRunAllowed', 'governanceCheckRequired'], 'host.preflight'));
  if (host?.preflight?.freshTaskRequired !== true || host?.preflight?.governanceCheckRequired !== true
    || ['resumeAllowed', 'sameSessionAcrossArmsAllowed', 'armIsolationVerified', 'registryObserved', 'repositoryStdioAllowed', 'pluginCacheProcessAllowed', 'hookDirectRunAllowed'].some(field => host?.preflight?.[field] !== false)) failures.push('host preflight 越权或过度声明');
  failures.push(...exactFields(host?.projectionDigests, ['agentSha256', 'graderSha256'], 'host.projectionDigests'));
  if (host?.projectionDigests?.agentSha256 !== hashPacket('jsonutils.registration-canary.agent-packet/v1', agent)
    || host?.projectionDigests?.graderSha256 !== hashPacket('jsonutils.registration-canary.grader-packet/v1', grader)) failures.push('projection digest 漂移');
  failures.push(...collectEvolutionSensitiveFieldFailures(bundle, 'registration canary packet'));
  return failures;
};
