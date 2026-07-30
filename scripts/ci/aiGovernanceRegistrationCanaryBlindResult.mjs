import {
  collectEvolutionSensitiveFieldFailures,
  isEvolutionRecord,
} from './aiGovernanceEvolutionEvalContract.mjs';
import { verifyEvolutionTraceReceipt } from './aiGovernanceEvolutionTrace.mjs';
import { hashRegistrationCanaryPacketValue } from './aiGovernanceRegistrationCanaryPacket.mjs';

const MAX_RESULT_BYTES = 512 * 1024;
export const REGISTRATION_CANARY_RESULT_VERSION = '1.0.0';
export const REGISTRATION_CANARY_RESULT_CASE_ID = 'mcp-project-registration-discovery';
export const REGISTRATION_CANARY_SHA256_PATTERN = /^[0-9a-f]{64}$/;
export const REGISTRATION_CANARY_REVISION_PATTERN = /^worktree-[0-9a-f]{64}$/;
export const REGISTRATION_CANARY_BLIND_ALIAS_PATTERN = /^canary-[0-9a-f]{32}$/;
const FALLBACKS = new Set([
  'none', 'repository-stdio', 'plugin-cache-process', 'static-config', 'hook-direct-run', 'shell',
]);
const DISCOVERY_STATES = new Set(['discovered', 'missing', 'unavailable']);
const RESULT_FIELDS = [
  'schemaVersion', 'artifactType', 'dataClass', 'resultVersion', 'blindTrialAlias',
  'bindings', 'execution', 'observation', 'outputSha256', 'trace', 'claims', 'privacy',
];
export const REGISTRATION_CANARY_BINDING_FIELDS = [
  'agentPacketSha256', 'graderPacketSha256', 'fixtureRevision', 'environmentSha256',
  'observationSha256', 'traceSha256',
];
const EXECUTION_FIELDS = [
  'terminalStatus', 'exitCode', 'stdoutDrained', 'timedOut', 'binaryStable', 'outputLimitExceeded',
];
export const REGISTRATION_CANARY_OBSERVATION_FIELDS = [
  'registrySurface', 'serverDiscovery', 'toolDiscovery', 'fallback', 'infrastructure',
];
const RESULT_CLAIMS = Object.freeze({
  executionReported: true,
  executionVerified: false,
  automaticLedgerWrites: false,
  outcomeEligible: false,
});
export const REGISTRATION_CANARY_PRIVACY = Object.freeze({
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
const FORBIDDEN_BLIND_FIELDS = new Set([
  'arm', 'treatment', 'pair', 'trialid', 'executionordinal', 'plugin', 'pluginstate',
  'expectedoutcome', 'graders', 'verdict', 'score',
]);
const TRACE_EVENT_TYPES = new Set([
  'session.start', 'mcp.call', 'mcp.result', 'response.finish', 'session.finish',
]);
const TRACE_MCP_NAME = 'jsonutils-governance/ai_governance_scorecard';
const TRACE_RESULT_KEYS = ['maturityScorecard.nextFocus.id'];
const FORBIDDEN_BLIND_VALUE_PATTERN = /(?:^|[^a-z])(baseline|candidate|project-config-only|project-plugin-registration)(?:$|[^a-z])/i;

export const collectRegistrationCanaryExactFieldFailures = (value, fields, label) => {
  if (!isEvolutionRecord(value)) return [`${label} 必须是对象`];
  const actual = Object.keys(value).sort();
  const expected = [...fields].sort();
  return JSON.stringify(actual) === JSON.stringify(expected) ? [] : [`${label} 必须是闭字段对象`];
};

export const collectRegistrationCanaryFalseObjectFailures = (value, template, label) => {
  const failures = collectRegistrationCanaryExactFieldFailures(value, Object.keys(template), label);
  if (failures.length > 0) return failures;
  return Object.keys(template)
    .filter(field => value[field] !== false)
    .map(field => `${label}.${field} 必须为 false`);
};

export const collectRegistrationCanaryExactBooleanObjectFailures = (value, template, label) => {
  const failures = collectRegistrationCanaryExactFieldFailures(value, Object.keys(template), label);
  if (failures.length > 0) return failures;
  return Object.entries(template)
    .filter(([field, expected]) => value[field] !== expected)
    .map(([field, expected]) => `${label}.${field} 必须为 ${expected}`);
};

export const collectRegistrationCanaryForbiddenBlindFieldFailures = (
  value,
  label,
  currentPath = '$',
) => {
  if (!value || typeof value !== 'object') return [];
  const failures = [];
  for (const [field, child] of Object.entries(value)) {
    const normalized = field.replace(/[^a-z0-9]/gi, '').toLowerCase();
    const childPath = Array.isArray(value) ? `${currentPath}[${field}]` : `${currentPath}.${field}`;
    if (!Array.isArray(value) && FORBIDDEN_BLIND_FIELDS.has(normalized)) {
      failures.push(`${label} 禁止盲评字段 ${childPath}`);
    }
    failures.push(...collectRegistrationCanaryForbiddenBlindFieldFailures(child, label, childPath));
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

export const registrationCanaryBlindOperationId = blindTrialAlias => `op-${hashPacket(
  'jsonutils.registration-canary.blind-trace-operation/v1', blindTrialAlias,
).slice(0, 24)}`;

export const collectRegistrationCanaryBlindResultFailures = (result) => {
  const failures = collectRegistrationCanaryExactFieldFailures(
    result,
    RESULT_FIELDS,
    'blind result',
  );
  if (!isEvolutionRecord(result)) return failures;
  if (result.schemaVersion !== 1 || result.artifactType !== 'ai-registration-canary-blind-result'
    || result.dataClass !== 'redacted'
    || result.resultVersion !== REGISTRATION_CANARY_RESULT_VERSION
    || !REGISTRATION_CANARY_BLIND_ALIAS_PATTERN.test(result.blindTrialAlias ?? '')) {
    failures.push('blind result 基础字段非法');
  }
  failures.push(...collectRegistrationCanaryExactFieldFailures(
    result.bindings,
    REGISTRATION_CANARY_BINDING_FIELDS,
    'blind result.bindings',
  ));
  if (isEvolutionRecord(result.bindings)) {
    for (const field of REGISTRATION_CANARY_BINDING_FIELDS.filter(name => name.endsWith('Sha256'))) {
      if (!REGISTRATION_CANARY_SHA256_PATTERN.test(result.bindings[field] ?? '')) {
        failures.push(`blind result.bindings.${field} 非法`);
      }
    }
    if (!REGISTRATION_CANARY_REVISION_PATTERN.test(result.bindings.fixtureRevision ?? '')
      || !REGISTRATION_CANARY_SHA256_PATTERN.test(result.bindings.environmentSha256 ?? '')) {
      failures.push('blind result fixture/environment 绑定非法');
    }
  }
  failures.push(...collectRegistrationCanaryExactFieldFailures(
    result.execution,
    EXECUTION_FIELDS,
    'blind result.execution',
  ));
  if (isEvolutionRecord(result.execution)) {
    if (!['completed', 'failed', 'interrupted'].includes(result.execution.terminalStatus)) {
      failures.push('blind result.execution.terminalStatus 非法');
    }
    if (!isSafeInteger(result.execution.exitCode, 0, 255)) {
      failures.push('blind result.execution.exitCode 非法');
    }
    for (const field of ['stdoutDrained', 'timedOut', 'binaryStable', 'outputLimitExceeded']) {
      if (typeof result.execution[field] !== 'boolean') {
        failures.push(`blind result.execution.${field} 必须是布尔值`);
      }
    }
  }
  failures.push(...collectRegistrationCanaryExactFieldFailures(
    result.observation,
    REGISTRATION_CANARY_OBSERVATION_FIELDS,
    'blind result.observation',
  ));
  if (isEvolutionRecord(result.observation)) {
    if (!['codex-task-registry', 'unavailable'].includes(result.observation.registrySurface)) {
      failures.push('blind result.observation.registrySurface 非法');
    }
    if (!DISCOVERY_STATES.has(result.observation.serverDiscovery)) {
      failures.push('blind result.observation.serverDiscovery 非法');
    }
    if (!DISCOVERY_STATES.has(result.observation.toolDiscovery)) {
      failures.push('blind result.observation.toolDiscovery 非法');
    }
    if (!FALLBACKS.has(result.observation.fallback)) {
      failures.push('blind result.observation.fallback 非法');
    }
    if (!['reported-valid', 'reported-invalid', 'unknown'].includes(result.observation.infrastructure)) {
      failures.push('blind result.observation.infrastructure 非法');
    }
    if (result.observation.toolDiscovery === 'discovered'
      && result.observation.serverDiscovery !== 'discovered') {
      failures.push('tool discovered 不能早于 server discovered');
    }
    if (result.observation.infrastructure === 'reported-valid'
      && result.observation.registrySurface !== 'codex-task-registry') {
      failures.push('reported-valid 必须观察 codex-task-registry');
    }
  }
  if (!REGISTRATION_CANARY_SHA256_PATTERN.test(result.outputSha256 ?? '')) {
    failures.push('blind result.outputSha256 非法');
  }
  if (isEvolutionRecord(result.bindings)) {
    if (result.bindings.observationSha256
      !== hashPacket('jsonutils.registration-canary.observation/v1', result.observation)) {
      failures.push('blind result observation digest 漂移');
    }
    if (result.bindings.traceSha256
      !== hashPacket('jsonutils.registration-canary.trace/v1', result.trace)) {
      failures.push('blind result trace digest 漂移');
    }
    if (result.trace?.beforeRevision !== result.bindings.fixtureRevision
      || result.trace?.afterRevision !== result.bindings.fixtureRevision) {
      failures.push('blind result trace/fixture revision 漂移');
    }
  }
  const responseEvents = Array.isArray(result.trace?.events)
    ? result.trace.events.filter(event => event?.type === 'response.finish') : [];
  if (responseEvents.length !== 1 || responseEvents[0]?.sha256 !== result.outputSha256) {
    failures.push('blind result output digest 必须绑定唯一 response.finish');
  }
  const traceVerification = verifyEvolutionTraceReceipt({
    trace: result.trace,
    revision: result.bindings?.fixtureRevision,
    validations: [],
  });
  failures.push(...traceVerification.failures.map(
    failure => `blind result trace 非法：${failure}`,
  ));
  const traceEvents = Array.isArray(result.trace?.events) ? result.trace.events : [];
  const mcpEvents = traceEvents.filter(event => ['mcp.call', 'mcp.result'].includes(event.type));
  const expectedOperationId = registrationCanaryBlindOperationId(result.blindTrialAlias);
  if (traceEvents.some(event => !TRACE_EVENT_TYPES.has(event.type) || event.actorId !== 'root')
    || mcpEvents.some(event => event.name !== TRACE_MCP_NAME
      || event.operationId !== expectedOperationId
      || JSON.stringify(event.keys)
        !== JSON.stringify(event.type === 'mcp.call' ? [] : TRACE_RESULT_KEYS))) {
    failures.push('blind result trace 含可编码 arm 的 actor/operation/name/keys/event 侧信道');
  }
  failures.push(...collectRegistrationCanaryExactBooleanObjectFailures(
    result.claims,
    RESULT_CLAIMS,
    'blind result.claims',
  ));
  failures.push(...collectRegistrationCanaryFalseObjectFailures(
    result.privacy,
    REGISTRATION_CANARY_PRIVACY,
    'blind result.privacy',
  ));
  failures.push(...collectRegistrationCanaryForbiddenBlindFieldFailures(result, 'blind result'));
  if (containsForbiddenBlindValue(result)) {
    failures.push('blind result 禁止 arm/treatment 字符串值侧信道');
  }
  failures.push(...collectEvolutionSensitiveFieldFailures(result, 'blind result'));
  return failures;
};

export const parseRegistrationCanaryBlindResult = (resultJson) => {
  if (typeof resultJson !== 'string' || Buffer.byteLength(resultJson, 'utf8') > MAX_RESULT_BYTES) {
    throw new TypeError('blind result 必须是至多 512 KiB 的紧凑 JSON 字符串');
  }
  let result;
  try {
    result = JSON.parse(resultJson);
  } catch {
    throw new TypeError('blind result 不是合法 JSON');
  }
  if (JSON.stringify(result) !== resultJson) {
    throw new TypeError('blind result 必须是精确紧凑 JSON，且不能含重复键');
  }
  const failures = collectRegistrationCanaryBlindResultFailures(result);
  if (failures.length > 0) throw new TypeError(failures.join('；'));
  return result;
};
