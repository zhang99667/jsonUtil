import {
  collectEvolutionSensitiveFieldFailures,
  isEvolutionRecord,
} from './aiGovernanceEvolutionEvalContract.mjs';
import {
  hashEvolutionTraceValue,
  verifyEvolutionTraceReceipt,
} from './aiGovernanceEvolutionTrace.mjs';
import { verifyRegisteredEvolutionTracePolicy } from './aiGovernanceEvolutionTracePolicies.mjs';
import { hashRegistrationCanaryPacketValue } from './aiGovernanceRegistrationCanaryPacket.mjs';

const MAX_RESULT_BYTES = 512 * 1024;
const SHA256_PATTERN = /^[0-9a-f]{64}$/;
const REVISION_PATTERN = /^worktree-[0-9a-f]{64}$/;
const BLIND_ALIAS_PATTERN = /^canary-[0-9a-f]{32}$/;
const RESULT_VERSION = '1.0.0';
const CASE_ID = 'mcp-project-registration-discovery';
const FALLBACKS = new Set([
  'none', 'repository-stdio', 'plugin-cache-process', 'static-config', 'hook-direct-run', 'shell',
]);
const DISCOVERY_STATES = new Set(['discovered', 'missing', 'unavailable']);
const RESULT_FIELDS = [
  'schemaVersion', 'artifactType', 'dataClass', 'resultVersion', 'blindTrialAlias',
  'bindings', 'execution', 'observation', 'outputSha256', 'trace', 'claims', 'privacy',
];
const BINDING_FIELDS = [
  'agentPacketSha256', 'graderPacketSha256', 'fixtureRevision', 'environmentSha256',
  'observationSha256', 'traceSha256',
];
const EXECUTION_FIELDS = [
  'terminalStatus', 'exitCode', 'stdoutDrained', 'timedOut', 'binaryStable', 'outputLimitExceeded',
];
const OBSERVATION_FIELDS = [
  'registrySurface', 'serverDiscovery', 'toolDiscovery', 'fallback', 'infrastructure',
];
const RESULT_CLAIMS = Object.freeze({
  executionReported: true,
  executionVerified: false,
  automaticLedgerWrites: false,
  outcomeEligible: false,
});
const GRADE_CLAIMS = Object.freeze({
  armKnown: false,
  callerVerdictAccepted: false,
  automaticLedgerWrites: false,
  outcomeEligible: false,
  trusted: false,
});
const PRIVACY = Object.freeze({
  sourceUserContentStored: false,
  reasoningStored: false,
  toolPayloadStored: false,
  authMaterialStored: false,
  userConfigStored: false,
  absoluteUserPathStored: false,
  responseBodyStored: false,
  traceBodyStored: false,
  armStored: false,
  rubricStored: false,
});
const GRADE_FIELDS = [
  'schemaVersion', 'artifactType', 'dataClass', 'gradeVersion', 'blindTrialAlias',
  'bindings', 'resultSha256', 'rubricSha256', 'grade', 'reasonCodes', 'traceReview',
  'claims', 'privacy',
];
const GRADE_RESULT_FIELDS = ['status', 'verdict', 'score'];
const TRACE_REVIEW_FIELDS = ['structureStatus', 'completenessStatus', 'policyStatus'];
const SUCCESS_REASON = 'registration-and-tool-discovered';
const INFRASTRUCTURE_REASON_CODES = new Set([
  'execution-not-complete', 'stdout-not-drained', 'capture-timeout', 'binary-unstable',
  'output-limit-exceeded', 'observation-infrastructure-invalid', 'trace-incomplete',
  'trace-terminal-not-passed', 'forbidden-fallback', 'registry-surface-unavailable',
  'trace-policy-unavailable', 'trace-adapter-mismatch', 'discovery-unavailable',
]);
const BEHAVIOR_REASON_CODES = new Set(['server-not-discovered', 'tool-not-discovered', 'trace-policy-not-satisfied']);
const REASON_CODES = new Set([SUCCESS_REASON, ...INFRASTRUCTURE_REASON_CODES, ...BEHAVIOR_REASON_CODES]);
const FORBIDDEN_BLIND_FIELDS = new Set([
  'arm', 'treatment', 'pair', 'trialid', 'executionordinal', 'plugin', 'pluginstate',
  'expectedoutcome', 'graders', 'verdict', 'score',
]);
const AGENT_FIELDS = [
  'schemaVersion', 'artifactType', 'dataClass', 'packetVersion', 'blindTrialAlias', 'state',
  'bindings', 'input', 'outputContract', 'claims', 'privacy',
];
const GRADER_FIELDS = [
  'schemaVersion', 'artifactType', 'dataClass', 'packetVersion', 'blindTrialAlias', 'state',
  'caseRef', 'expectedOutcome', 'graders', 'rubricSha256', 'claims', 'privacy',
];
const PACKET_CLAIMS = Object.freeze({ modelInvoked: false, executionObserved: false, automaticLedgerWrites: false, outcomeEligible: false });
const PACKET_PRIVACY = Object.freeze({ sourceUserContentStored: false, reasoningStored: false, toolPayloadStored: false, authMaterialStored: false, userConfigStored: false, absoluteUserPathStored: false });
const TRACE_EVENT_TYPES = new Set(['session.start', 'mcp.call', 'mcp.result', 'response.finish', 'session.finish']);
const TRACE_MCP_NAME = 'jsonutils-governance/ai_governance_scorecard';
const TRACE_RESULT_KEYS = ['maturityScorecard.nextFocus.id'];
const FORBIDDEN_BLIND_VALUE_PATTERN = /(?:^|[^a-z])(baseline|candidate|project-config-only|project-plugin-registration)(?:$|[^a-z])/i;

export const REGISTRATION_CANARY_RESULT = Object.freeze({
  id: 'mcp-registration-canary-result-ingestion',
  version: RESULT_VERSION,
  caseId: CASE_ID,
});

const exactFields = (value, fields, label) => {
  if (!isEvolutionRecord(value)) return [`${label} 必须是对象`];
  const actual = Object.keys(value).sort();
  const expected = [...fields].sort();
  return JSON.stringify(actual) === JSON.stringify(expected) ? [] : [`${label} 必须是闭字段对象`];
};
const falseObjectFailures = (value, template, label) => {
  const failures = exactFields(value, Object.keys(template), label);
  if (failures.length > 0) return failures;
  return Object.keys(template).filter(field => value[field] !== false).map(field => `${label}.${field} 必须为 false`);
};
const exactBooleanObjectFailures = (value, template, label) => {
  const failures = exactFields(value, Object.keys(template), label);
  if (failures.length > 0) return failures;
  return Object.entries(template).filter(([field, expected]) => value[field] !== expected)
    .map(([field, expected]) => `${label}.${field} 必须为 ${expected}`);
};
const collectForbiddenBlindFieldFailures = (value, label, currentPath = '$') => {
  if (!value || typeof value !== 'object') return [];
  const failures = [];
  for (const [field, child] of Object.entries(value)) {
    const normalized = field.replace(/[^a-z0-9]/gi, '').toLowerCase();
    const childPath = Array.isArray(value) ? `${currentPath}[${field}]` : `${currentPath}.${field}`;
    if (!Array.isArray(value) && FORBIDDEN_BLIND_FIELDS.has(normalized)) {
      failures.push(`${label} 禁止盲评字段 ${childPath}`);
    }
    failures.push(...collectForbiddenBlindFieldFailures(child, label, childPath));
  }
  return failures;
};
const containsForbiddenBlindValue = value => typeof value === 'string'
  ? FORBIDDEN_BLIND_VALUE_PATTERN.test(value)
  : Array.isArray(value) ? value.some(containsForbiddenBlindValue)
    : isEvolutionRecord(value) ? Object.values(value).some(containsForbiddenBlindValue) : false;
const isSafeInteger = (value, min, max) => Number.isSafeInteger(value) && value >= min && value <= max;
const hashPacket = hashRegistrationCanaryPacketValue;

export const hashRegistrationCanaryBlindResult = value => hashPacket(
  'jsonutils.registration-canary.blind-result/v1', value,
);
export const hashRegistrationCanaryBlindGrade = value => hashPacket(
  'jsonutils.registration-canary.blind-grade/v1', value,
);
export const registrationCanaryBlindOperationId = blindTrialAlias => `op-${hashPacket(
  'jsonutils.registration-canary.blind-trace-operation/v1', blindTrialAlias,
).slice(0, 24)}`;

export const collectRegistrationCanaryBlindResultFailures = (result) => {
  const failures = exactFields(result, RESULT_FIELDS, 'blind result');
  if (!isEvolutionRecord(result)) return failures;
  if (result.schemaVersion !== 1 || result.artifactType !== 'ai-registration-canary-blind-result'
    || result.dataClass !== 'redacted' || result.resultVersion !== RESULT_VERSION
    || !BLIND_ALIAS_PATTERN.test(result.blindTrialAlias ?? '')) failures.push('blind result 基础字段非法');
  failures.push(...exactFields(result.bindings, BINDING_FIELDS, 'blind result.bindings'));
  if (isEvolutionRecord(result.bindings)) {
    for (const field of BINDING_FIELDS.filter(name => name.endsWith('Sha256'))) {
      if (!SHA256_PATTERN.test(result.bindings[field] ?? '')) failures.push(`blind result.bindings.${field} 非法`);
    }
    if (!REVISION_PATTERN.test(result.bindings.fixtureRevision ?? '')
      || !SHA256_PATTERN.test(result.bindings.environmentSha256 ?? '')) failures.push('blind result fixture/environment 绑定非法');
  }
  failures.push(...exactFields(result.execution, EXECUTION_FIELDS, 'blind result.execution'));
  if (isEvolutionRecord(result.execution)) {
    if (!['completed', 'failed', 'interrupted'].includes(result.execution.terminalStatus)) failures.push('blind result.execution.terminalStatus 非法');
    if (!isSafeInteger(result.execution.exitCode, 0, 255)) failures.push('blind result.execution.exitCode 非法');
    for (const field of ['stdoutDrained', 'timedOut', 'binaryStable', 'outputLimitExceeded']) {
      if (typeof result.execution[field] !== 'boolean') failures.push(`blind result.execution.${field} 必须是布尔值`);
    }
  }
  failures.push(...exactFields(result.observation, OBSERVATION_FIELDS, 'blind result.observation'));
  if (isEvolutionRecord(result.observation)) {
    if (!['codex-task-registry', 'unavailable'].includes(result.observation.registrySurface)) failures.push('blind result.observation.registrySurface 非法');
    if (!DISCOVERY_STATES.has(result.observation.serverDiscovery)) failures.push('blind result.observation.serverDiscovery 非法');
    if (!DISCOVERY_STATES.has(result.observation.toolDiscovery)) failures.push('blind result.observation.toolDiscovery 非法');
    if (!FALLBACKS.has(result.observation.fallback)) failures.push('blind result.observation.fallback 非法');
    if (!['reported-valid', 'reported-invalid', 'unknown'].includes(result.observation.infrastructure)) failures.push('blind result.observation.infrastructure 非法');
    if (result.observation.toolDiscovery === 'discovered' && result.observation.serverDiscovery !== 'discovered') failures.push('tool discovered 不能早于 server discovered');
    if (result.observation.infrastructure === 'reported-valid' && result.observation.registrySurface !== 'codex-task-registry') failures.push('reported-valid 必须观察 codex-task-registry');
  }
  if (!SHA256_PATTERN.test(result.outputSha256 ?? '')) failures.push('blind result.outputSha256 非法');
  if (isEvolutionRecord(result.bindings)) {
    if (result.bindings.observationSha256 !== hashPacket('jsonutils.registration-canary.observation/v1', result.observation)) failures.push('blind result observation digest 漂移');
    if (result.bindings.traceSha256 !== hashPacket('jsonutils.registration-canary.trace/v1', result.trace)) failures.push('blind result trace digest 漂移');
    if (result.trace?.beforeRevision !== result.bindings.fixtureRevision
      || result.trace?.afterRevision !== result.bindings.fixtureRevision) failures.push('blind result trace/fixture revision 漂移');
  }
  const responseEvents = Array.isArray(result.trace?.events)
    ? result.trace.events.filter(event => event?.type === 'response.finish') : [];
  if (responseEvents.length !== 1 || responseEvents[0]?.sha256 !== result.outputSha256) failures.push('blind result output digest 必须绑定唯一 response.finish');
  const traceVerification = verifyEvolutionTraceReceipt({
    trace: result.trace,
    revision: result.bindings?.fixtureRevision,
    validations: [],
  });
  failures.push(...traceVerification.failures.map(failure => `blind result trace 非法：${failure}`));
  const traceEvents = Array.isArray(result.trace?.events) ? result.trace.events : [];
  const mcpEvents = traceEvents.filter(event => ['mcp.call', 'mcp.result'].includes(event.type));
  const expectedOperationId = registrationCanaryBlindOperationId(result.blindTrialAlias);
  if (traceEvents.some(event => !TRACE_EVENT_TYPES.has(event.type) || event.actorId !== 'root')
    || mcpEvents.some(event => event.name !== TRACE_MCP_NAME || event.operationId !== expectedOperationId
      || JSON.stringify(event.keys) !== JSON.stringify(event.type === 'mcp.call' ? [] : TRACE_RESULT_KEYS))) {
    failures.push('blind result trace 含可编码 arm 的 actor/operation/name/keys/event 侧信道');
  }
  failures.push(...exactBooleanObjectFailures(result.claims, RESULT_CLAIMS, 'blind result.claims'));
  failures.push(...falseObjectFailures(result.privacy, PRIVACY, 'blind result.privacy'));
  failures.push(...collectForbiddenBlindFieldFailures(result, 'blind result'));
  if (containsForbiddenBlindValue(result)) failures.push('blind result 禁止 arm/treatment 字符串值侧信道');
  failures.push(...collectEvolutionSensitiveFieldFailures(result, 'blind result'));
  return failures;
};

export const parseRegistrationCanaryBlindResult = (resultJson) => {
  if (typeof resultJson !== 'string' || Buffer.byteLength(resultJson, 'utf8') > MAX_RESULT_BYTES) {
    throw new TypeError('blind result 必须是至多 512 KiB 的紧凑 JSON 字符串');
  }
  let result;
  try { result = JSON.parse(resultJson); } catch { throw new TypeError('blind result 不是合法 JSON'); }
  if (JSON.stringify(result) !== resultJson) throw new TypeError('blind result 必须是精确紧凑 JSON，且不能含重复键');
  const failures = collectRegistrationCanaryBlindResultFailures(result);
  if (failures.length > 0) throw new TypeError(failures.join('；'));
  return result;
};

const collectProjectionFailures = (agentPacket, graderPacket, result, caseItem) => {
  const failures = [
    ...exactFields(agentPacket, AGENT_FIELDS, 'agent packet'),
    ...exactFields(graderPacket, GRADER_FIELDS, 'grader packet'),
  ];
  if (!isEvolutionRecord(agentPacket) || !isEvolutionRecord(graderPacket)) return failures;
  if (agentPacket.schemaVersion !== 1 || graderPacket.schemaVersion !== 1
    || agentPacket.packetVersion !== '1.0.0' || graderPacket.packetVersion !== '1.0.0'
    || agentPacket.dataClass !== 'redacted' || graderPacket.dataClass !== 'redacted'
    || agentPacket.artifactType !== 'ai-registration-canary-agent-packet'
    || graderPacket.artifactType !== 'ai-registration-canary-grader-packet'
    || agentPacket.blindTrialAlias !== result.blindTrialAlias
    || graderPacket.blindTrialAlias !== result.blindTrialAlias) failures.push('blind result 与 Agent/grader alias 不匹配');
  for (const [label, packet] of [['agent packet', agentPacket], ['grader packet', graderPacket]]) {
    failures.push(...exactFields(packet.state, ['status', 'reasonCode'], `${label}.state`));
    if (packet.state?.status !== 'prepared' || packet.state?.reasonCode !== 'external-preflight-required') failures.push(`${label}.state 非法`);
    failures.push(...exactBooleanObjectFailures(packet.claims, PACKET_CLAIMS, `${label}.claims`));
    failures.push(...falseObjectFailures(packet.privacy, PACKET_PRIVACY, `${label}.privacy`));
  }
  failures.push(...exactFields(agentPacket.bindings, ['fixtureRevision', 'environmentSha256'], 'agent packet.bindings'));
  failures.push(...exactFields(agentPacket.input, ['request', 'context'], 'agent packet.input'));
  failures.push(...exactFields(agentPacket.outputContract, ['reportType', 'requiredFields', 'forbiddenEvidenceSources'], 'agent packet.outputContract'));
  failures.push(...exactFields(graderPacket.caseRef, ['id', 'caseVersion', 'subjectVersion'], 'grader packet.caseRef'));
  if (result.bindings.agentPacketSha256 !== hashPacket('jsonutils.registration-canary.agent-packet/v1', agentPacket)
    || result.bindings.graderPacketSha256 !== hashPacket('jsonutils.registration-canary.grader-packet/v1', graderPacket)) failures.push('blind result projection digest 漂移');
  if (agentPacket.bindings?.fixtureRevision !== result.bindings.fixtureRevision
    || agentPacket.bindings?.environmentSha256 !== result.bindings.environmentSha256) failures.push('blind result Agent fixture/environment 漂移');
  const expectedInput = { request: caseItem?.input?.request, context: caseItem?.input?.context };
  const expectedCaseRef = { id: caseItem?.id, caseVersion: caseItem?.caseVersion, subjectVersion: caseItem?.subject?.version };
  const expectedRubric = { expectedOutcome: caseItem?.expectedOutcome, graders: caseItem?.graders };
  if (JSON.stringify(agentPacket.input) !== JSON.stringify(expectedInput)
    || JSON.stringify(graderPacket.caseRef) !== JSON.stringify(expectedCaseRef)
    || JSON.stringify({ expectedOutcome: graderPacket.expectedOutcome, graders: graderPacket.graders }) !== JSON.stringify(expectedRubric)
    || graderPacket.rubricSha256 !== hashPacket('jsonutils.registration-canary.rubric/v1', expectedRubric)) failures.push('Agent/grader projection 未绑定当前 case 内容');
  if (agentPacket.outputContract?.reportType !== 'ai-registration-canary-observation'
    || JSON.stringify(agentPacket.outputContract?.requiredFields) !== JSON.stringify(OBSERVATION_FIELDS)
    || JSON.stringify(agentPacket.outputContract?.forbiddenEvidenceSources) !== JSON.stringify(['repository-stdio', 'plugin-cache-process', 'static-config', 'hook-direct-run'])) failures.push('agent outputContract 非法');
  failures.push(...collectForbiddenBlindFieldFailures(agentPacket, 'agent packet'));
  return failures;
};

const collectInfrastructureReasonCodes = (result, traceVerification) => {
  const reasons = [];
  if (result.execution.terminalStatus !== 'completed' || result.execution.exitCode !== 0) reasons.push('execution-not-complete');
  if (!result.execution.stdoutDrained) reasons.push('stdout-not-drained');
  if (result.execution.timedOut) reasons.push('capture-timeout');
  if (!result.execution.binaryStable) reasons.push('binary-unstable');
  if (result.execution.outputLimitExceeded) reasons.push('output-limit-exceeded');
  if (result.observation.infrastructure !== 'reported-valid') reasons.push('observation-infrastructure-invalid');
  if (traceVerification.completeness.status !== 'complete') reasons.push('trace-incomplete');
  const terminalEvents = result.trace.events.filter(event => ['response.finish', 'session.finish'].includes(event.type));
  if (terminalEvents.some(event => event.status !== 'passed')) reasons.push('trace-terminal-not-passed');
  if (result.observation.fallback !== 'none'
    || result.trace.events.some(event => ['command.call', 'command.result', 'file.change', 'capability.use'].includes(event.type))) reasons.push('forbidden-fallback');
  if (result.observation.registrySurface !== 'codex-task-registry') reasons.push('registry-surface-unavailable');
  if (result.observation.serverDiscovery === 'unavailable' || result.observation.toolDiscovery === 'unavailable') reasons.push('discovery-unavailable');
  return [...new Set(reasons)];
};

export const collectRegistrationCanaryBlindGradeFailures = (grade) => {
  const failures = exactFields(grade, GRADE_FIELDS, 'blind grade');
  if (!isEvolutionRecord(grade)) return failures;
  if (grade.schemaVersion !== 1 || grade.artifactType !== 'ai-registration-canary-blind-grade'
    || grade.dataClass !== 'redacted' || grade.gradeVersion !== RESULT_VERSION
    || !BLIND_ALIAS_PATTERN.test(grade.blindTrialAlias ?? '')) failures.push('blind grade 基础字段非法');
  failures.push(...exactFields(grade.bindings, BINDING_FIELDS, 'blind grade.bindings'));
  if (isEvolutionRecord(grade.bindings)) {
    for (const field of BINDING_FIELDS.filter(name => name.endsWith('Sha256'))) if (!SHA256_PATTERN.test(grade.bindings[field] ?? '')) failures.push(`blind grade.bindings.${field} 非法`);
    if (!REVISION_PATTERN.test(grade.bindings.fixtureRevision ?? '') || !SHA256_PATTERN.test(grade.bindings.environmentSha256 ?? '')) failures.push('blind grade fixture/environment 绑定非法');
  }
  if (!SHA256_PATTERN.test(grade.resultSha256 ?? '') || !SHA256_PATTERN.test(grade.rubricSha256 ?? '')) failures.push('blind grade result/rubric digest 非法');
  failures.push(...exactFields(grade.grade, GRADE_RESULT_FIELDS, 'blind grade.grade'));
  if (grade.grade?.status === 'graded') {
    if (!['pass', 'fail'].includes(grade.grade.verdict) || ![0, 100].includes(grade.grade.score)) failures.push('graded blind grade 必须给出 0/100 verdict');
  } else if (grade.grade?.status !== 'ungradable' || grade.grade.verdict !== null || grade.grade.score !== null) failures.push('ungradable blind grade 必须使用 null verdict/score');
  if (!Array.isArray(grade.reasonCodes) || grade.reasonCodes.length === 0
    || grade.reasonCodes.some(code => !REASON_CODES.has(code)) || new Set(grade.reasonCodes).size !== grade.reasonCodes.length) failures.push('blind grade reasonCodes 非法');
  if (grade.grade?.status === 'graded' && (grade.grade.verdict === 'pass'
    ? grade.grade.score !== 100 || JSON.stringify(grade.reasonCodes) !== JSON.stringify([SUCCESS_REASON])
    : grade.grade.score !== 0 || !grade.reasonCodes.every(code => BEHAVIOR_REASON_CODES.has(code)))) failures.push('blind grade verdict/score/reason 语义不一致');
  if (grade.grade?.status === 'ungradable' && !grade.reasonCodes.every(code => INFRASTRUCTURE_REASON_CODES.has(code))) failures.push('ungradable 只能使用 infrastructure reason');
  failures.push(...exactFields(grade.traceReview, TRACE_REVIEW_FIELDS, 'blind grade.traceReview'));
  if (grade.traceReview?.structureStatus !== 'accepted'
    || !['complete', 'partial', 'unknown'].includes(grade.traceReview?.completenessStatus)
    || !['verified', 'rejected', 'unverified', 'error'].includes(grade.traceReview?.policyStatus)) failures.push('blind grade traceReview 非法');
  failures.push(...exactBooleanObjectFailures(grade.claims, GRADE_CLAIMS, 'blind grade.claims'));
  failures.push(...falseObjectFailures(grade.privacy, PRIVACY, 'blind grade.privacy'));
  failures.push(...collectForbiddenBlindFieldFailures({ ...grade, grade: undefined }, 'blind grade'));
  failures.push(...collectEvolutionSensitiveFieldFailures(grade, 'blind grade'));
  return failures;
};

export const gradeRegistrationCanaryResultBlind = ({
  resultJson,
  agentPacket,
  graderPacket,
  caseItem,
  policyEntry,
  expectedFixtureRevision,
}) => {
  const result = parseRegistrationCanaryBlindResult(resultJson);
  const projectionFailures = collectProjectionFailures(agentPacket, graderPacket, result, caseItem);
  if (caseItem?.id !== CASE_ID || graderPacket?.caseRef?.id !== CASE_ID
    || graderPacket?.caseRef?.caseVersion !== caseItem?.caseVersion
    || graderPacket?.caseRef?.subjectVersion !== caseItem?.subject?.version) projectionFailures.push('grader/case 当前版本绑定非法');
  if (expectedFixtureRevision !== undefined && result.bindings.fixtureRevision !== expectedFixtureRevision) projectionFailures.push('blind result fixtureRevision 已过期');
  const expectedCaseSha256 = hashEvolutionTraceValue(caseItem);
  const traceVerification = verifyEvolutionTraceReceipt({
    trace: result.trace,
    revision: result.bindings.fixtureRevision,
    validations: [],
  }, { expectedCaseSha256, expectedPolicy: policyEntry?.descriptor });
  projectionFailures.push(...traceVerification.failures);
  if (projectionFailures.length > 0) throw new TypeError(projectionFailures.join('；'));
  const policyVerification = verifyRegisteredEvolutionTracePolicy(policyEntry, result.trace);
  const infrastructureReasons = collectInfrastructureReasonCodes(result, traceVerification);
  const adapterMatches = result.trace.adapter?.id === policyEntry?.policy?.adapter?.id
    && result.trace.adapter?.version === policyEntry?.policy?.adapter?.version;
  if (!adapterMatches) infrastructureReasons.push('trace-adapter-mismatch');
  if (!['verified', 'rejected'].includes(policyVerification.status)) infrastructureReasons.push('trace-policy-unavailable');
  const behaviorReasons = [];
  if (result.observation.serverDiscovery === 'missing') behaviorReasons.push('server-not-discovered');
  if (result.observation.toolDiscovery === 'missing') behaviorReasons.push('tool-not-discovered');
  if (policyVerification.status === 'rejected' && adapterMatches) behaviorReasons.push('trace-policy-not-satisfied');
  const ungradable = infrastructureReasons.length > 0;
  const passed = !ungradable && behaviorReasons.length === 0;
  const grade = {
    schemaVersion: 1,
    artifactType: 'ai-registration-canary-blind-grade',
    dataClass: 'redacted',
    gradeVersion: RESULT_VERSION,
    blindTrialAlias: result.blindTrialAlias,
    bindings: structuredClone(result.bindings),
    resultSha256: hashRegistrationCanaryBlindResult(result),
    rubricSha256: graderPacket.rubricSha256,
    grade: {
      status: ungradable ? 'ungradable' : 'graded',
      verdict: ungradable ? null : passed ? 'pass' : 'fail',
      score: ungradable ? null : passed ? 100 : 0,
    },
    reasonCodes: ungradable
      ? [...new Set(infrastructureReasons)]
      : passed ? [SUCCESS_REASON] : [...new Set(behaviorReasons)],
    traceReview: {
      structureStatus: 'accepted',
      completenessStatus: traceVerification.completeness.status,
      policyStatus: policyVerification.status,
    },
    claims: { ...GRADE_CLAIMS },
    privacy: { ...PRIVACY },
  };
  const failures = collectRegistrationCanaryBlindGradeFailures(grade);
  if (failures.length > 0) throw new TypeError(failures.join('；'));
  return grade;
};
