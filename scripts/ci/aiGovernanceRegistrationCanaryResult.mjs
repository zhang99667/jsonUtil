import {
  collectEvolutionSensitiveFieldFailures,
  isEvolutionRecord,
} from './aiGovernanceEvolutionEvalContract.mjs';
import {
  hashEvolutionTraceValue,
  verifyEvolutionTraceReceipt,
} from './aiGovernanceEvolutionTrace.mjs';
import { verifyRegisteredEvolutionTracePolicy } from './aiGovernanceEvolutionTracePolicies.mjs';
import {
  collectRegistrationCanaryExactBooleanObjectFailures,
  collectRegistrationCanaryExactFieldFailures,
  collectRegistrationCanaryFalseObjectFailures,
  collectRegistrationCanaryForbiddenBlindFieldFailures,
  hashRegistrationCanaryBlindResult,
  parseRegistrationCanaryBlindResult,
  REGISTRATION_CANARY_BINDING_FIELDS,
  REGISTRATION_CANARY_BLIND_ALIAS_PATTERN,
  REGISTRATION_CANARY_OBSERVATION_FIELDS,
  REGISTRATION_CANARY_PRIVACY,
  REGISTRATION_CANARY_RESULT_CASE_ID,
  REGISTRATION_CANARY_RESULT_VERSION,
  REGISTRATION_CANARY_REVISION_PATTERN,
  REGISTRATION_CANARY_SHA256_PATTERN,
} from './aiGovernanceRegistrationCanaryBlindResult.mjs';
import { hashRegistrationCanaryPacketValue } from './aiGovernanceRegistrationCanaryPacket.mjs';

const SHA256_PATTERN = REGISTRATION_CANARY_SHA256_PATTERN;
const REVISION_PATTERN = REGISTRATION_CANARY_REVISION_PATTERN;
const BLIND_ALIAS_PATTERN = REGISTRATION_CANARY_BLIND_ALIAS_PATTERN;
const RESULT_VERSION = REGISTRATION_CANARY_RESULT_VERSION;
const CASE_ID = REGISTRATION_CANARY_RESULT_CASE_ID;
const BINDING_FIELDS = REGISTRATION_CANARY_BINDING_FIELDS;
const OBSERVATION_FIELDS = REGISTRATION_CANARY_OBSERVATION_FIELDS;
const PRIVACY = REGISTRATION_CANARY_PRIVACY;
const exactFields = collectRegistrationCanaryExactFieldFailures;
const falseObjectFailures = collectRegistrationCanaryFalseObjectFailures;
const exactBooleanObjectFailures = collectRegistrationCanaryExactBooleanObjectFailures;
const collectForbiddenBlindFieldFailures =
  collectRegistrationCanaryForbiddenBlindFieldFailures;
const GRADE_CLAIMS = Object.freeze({
  armKnown: false,
  callerVerdictAccepted: false,
  automaticLedgerWrites: false,
  outcomeEligible: false,
  trusted: false,
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

export const REGISTRATION_CANARY_RESULT = Object.freeze({
  id: 'mcp-registration-canary-result-ingestion',
  version: RESULT_VERSION,
  caseId: CASE_ID,
});

const hashPacket = hashRegistrationCanaryPacketValue;

export const hashRegistrationCanaryBlindGrade = value => hashPacket(
  'jsonutils.registration-canary.blind-grade/v1', value,
);

export {
  collectRegistrationCanaryBlindResultFailures,
  hashRegistrationCanaryBlindResult,
  parseRegistrationCanaryBlindResult,
  registrationCanaryBlindOperationId,
} from './aiGovernanceRegistrationCanaryBlindResult.mjs';

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
  const reasonCodesValid = Array.isArray(grade.reasonCodes) && grade.reasonCodes.length > 0
    && grade.reasonCodes.every(code => REASON_CODES.has(code))
    && new Set(grade.reasonCodes).size === grade.reasonCodes.length;
  if (!reasonCodesValid) failures.push('blind grade reasonCodes 非法');
  if (reasonCodesValid && grade.grade?.status === 'graded' && (grade.grade.verdict === 'pass'
    ? grade.grade.score !== 100 || JSON.stringify(grade.reasonCodes) !== JSON.stringify([SUCCESS_REASON])
    : grade.grade.score !== 0 || !grade.reasonCodes.every(code => BEHAVIOR_REASON_CODES.has(code)))) failures.push('blind grade verdict/score/reason 语义不一致');
  if (reasonCodesValid && grade.grade?.status === 'ungradable'
    && !grade.reasonCodes.every(code => INFRASTRUCTURE_REASON_CODES.has(code))) failures.push('ungradable 只能使用 infrastructure reason');
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
