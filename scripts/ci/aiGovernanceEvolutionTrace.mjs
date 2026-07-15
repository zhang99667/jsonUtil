import { createHash } from 'node:crypto';

import {
  collectEvolutionSensitiveFieldFailures,
  isEvolutionRecord,
  isEvolutionString,
} from './aiGovernanceEvolutionEvalContract.mjs';

const SHA256_PATTERN = /^[0-9a-f]{64}$/;
const REVISION_PATTERN = /^(?:[0-9a-f]{40}|(?:worktree|commit|ci)-[0-9a-f]{40}|worktree-[0-9a-f]{64})$/;
const ID_PATTERN = /^[a-z][a-z0-9._-]{0,63}$/;
const VERSION_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/;
const NAME_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:/-]{0,99}$/;
const KEY_PATTERN = /^[A-Za-z][A-Za-z0-9_.-]{0,63}$/;
const TRACE_FIELDS = new Set(['schemaVersion', 'adapter', 'capture', 'caseSha256', 'policy', 'beforeRevision', 'afterRevision', 'events']);
const ADAPTER_FIELDS = new Set(['id', 'version']);
const CAPTURE_FIELDS = new Set(['status', 'sampling', 'droppedEvents', 'droppedAttributes', 'droppedLinks', 'flushStatus']);
const POLICY_FIELDS = new Set(['id', 'version', 'sha256']);
const EVENT_FIELDS = new Set([
  'sequence', 'type', 'actorId', 'childActorId', 'operationId', 'name', 'status', 'path',
  'sha256', 'beforeSha256', 'afterSha256', 'validationIndex', 'keys',
]);
const EVENT_TYPES = new Set([
  'session.start', 'session.finish', 'context.read', 'skill.decision', 'agent.spawn',
  'agent.finish', 'mcp.call', 'mcp.result', 'command.call', 'command.result',
  'capability.use', 'file.change', 'validation.start', 'validation.finish', 'response.finish',
]);
const EVENT_CONTRACTS = {
  'session.start': { required: [] },
  'session.finish': { required: ['status'], statuses: ['passed', 'failed', 'partial'] },
  'context.read': { required: ['path', 'sha256'] },
  'skill.decision': { required: ['name', 'status'], statuses: ['selected', 'skipped'] },
  'agent.spawn': { required: ['childActorId'] },
  'agent.finish': { required: ['status'], statuses: ['passed', 'failed', 'partial'] },
  'mcp.call': { required: ['operationId', 'name', 'status'], optional: ['keys'], statuses: ['started'] },
  'mcp.result': { required: ['operationId', 'name', 'status'], optional: ['keys'], statuses: ['passed', 'failed'] },
  'command.call': { required: ['operationId', 'name', 'status'], statuses: ['started'] },
  'command.result': { required: ['operationId', 'name', 'status'], statuses: ['passed', 'failed'] },
  'capability.use': { required: ['name', 'status'], statuses: ['passed', 'failed'] },
  'file.change': { required: ['path', 'beforeSha256', 'afterSha256', 'status'], statuses: ['passed', 'failed'] },
  'validation.start': { required: ['validationIndex', 'status'], statuses: ['started'] },
  'validation.finish': { required: ['validationIndex', 'status'], statuses: ['passed', 'failed'] },
  'response.finish': { required: ['sha256', 'status'], statuses: ['passed', 'failed', 'partial'] },
};
const MAX_EVENTS = 200;

const unexpectedFields = (value, allowed, label) => Object.keys(value)
  .filter(field => !allowed.has(field))
  .map(field => `${label}.${field} 不在允许字段中`);
const matches = (value, pattern) => typeof value === 'string' && pattern.test(value);
const isBoundedString = (value, max) => isEvolutionString(value) && value.length <= max;
const isNonNegativeInteger = value => Number.isInteger(value) && value >= 0;
const isSafePath = value => isBoundedString(value, 500)
  && !value.startsWith('/') && !value.includes('\\')
  && !value.split('/').some(part => part === '..' || part === '')
  && !value.includes('\0');

export const hashEvolutionTraceValue = value => createHash('sha256')
  .update(JSON.stringify(value), 'utf8').digest('hex');

const collectObjectFailures = (value, fields, label) => isEvolutionRecord(value)
  ? unexpectedFields(value, fields, label) : [`${label} 必须是对象`];

const collectEventFailures = (event, index) => {
  const label = `trace.events[${index}]`;
  if (!isEvolutionRecord(event)) return [`${label} 必须是对象`];
  const failures = unexpectedFields(event, EVENT_FIELDS, label);
  if (event.sequence !== index + 1) failures.push(`${label}.sequence 必须从 1 连续递增`);
  if (!EVENT_TYPES.has(event.type)) failures.push(`${label}.type 枚举值非法`);
  if (!matches(event.actorId, ID_PATTERN)) failures.push(`${label}.actorId 非法`);
  const contract = EVENT_CONTRACTS[event.type];
  if (!contract) return failures;
  const allowed = new Set(['sequence', 'type', 'actorId', ...contract.required, ...(contract.optional ?? [])]);
  failures.push(...Object.keys(event).filter(field => !allowed.has(field)).map(field => `${label}.${field} 不适用于 ${event.type}`));
  contract.required.forEach((field) => {
    if (event[field] === undefined) failures.push(`${label}.${field} 为必填字段`);
  });
  if (contract.statuses && !contract.statuses.includes(event.status)) failures.push(`${label}.status 枚举值非法`);
  for (const field of ['actorId', 'childActorId', 'operationId']) {
    if (event[field] !== undefined && !matches(event[field], ID_PATTERN)) failures.push(`${label}.${field} 非法`);
  }
  if (event.name !== undefined && !matches(event.name, NAME_PATTERN)) failures.push(`${label}.name 必须是稳定的非内容标识符`);
  if (event.path !== undefined && !isSafePath(event.path)) failures.push(`${label}.path 必须是安全的仓库相对路径`);
  if (event.keys !== undefined && (
    !Array.isArray(event.keys) || event.keys.length > 20
    || !event.keys.every(key => typeof key === 'string' && KEY_PATTERN.test(key))
    || new Set(event.keys).size !== event.keys.length
  )) failures.push(`${label}.keys 必须是不重复的安全字段名数组（最多 20 项）`);
  for (const field of ['sha256', 'beforeSha256', 'afterSha256']) {
    if (event[field] !== undefined && !matches(event[field], SHA256_PATTERN)) failures.push(`${label}.${field} 必须是小写 SHA-256`);
  }
  if (event.validationIndex !== undefined && (!Number.isInteger(event.validationIndex) || event.validationIndex < 1)) {
    failures.push(`${label}.validationIndex 必须是正整数`);
  }
  return failures;
};

const collectActorFailures = (events) => {
  const failures = [];
  const starts = events.filter(event => event?.type === 'session.start');
  const finishes = events.filter(event => event?.type === 'session.finish');
  if (starts.length !== 1 || starts[0] !== events[0]) failures.push('trace 必须以唯一 session.start 开始');
  if (finishes.length !== 1 || finishes[0] !== events.at(-1)) failures.push('trace 必须以唯一 session.finish 结束');
  const rootActorId = starts[0]?.actorId;
  if (finishes[0]?.actorId !== rootActorId) failures.push('trace session.start/session.finish 必须属于同一 root actor');
  const actors = new Map(rootActorId ? [[rootActorId, { live: true, root: true }]] : []);
  for (const event of events) {
    if (!isEvolutionRecord(event) || !matches(event.actorId, ID_PATTERN)) continue;
    const actor = actors.get(event.actorId);
    if (!actor) failures.push(`trace actor ${event.actorId} 在 spawn 前使用`);
    else if (!actor.live && event.type !== 'session.finish') failures.push(`trace actor ${event.actorId} 在 finish 后使用`);
    if (event.type === 'agent.spawn' && matches(event.childActorId, ID_PATTERN)) {
      if (!actor?.live) failures.push(`trace agent.spawn 的 parent actor ${event.actorId} 未存活`);
      if (event.childActorId === rootActorId || actors.has(event.childActorId)) failures.push('trace agent.spawn.childActorId 必须是唯一非 root actor');
      else actors.set(event.childActorId, { live: true, root: false });
    }
    if (event.type === 'agent.finish') {
      if (event.actorId === rootActorId) failures.push('trace root actor 只能由 session.finish 结束');
      else if (actor?.live) actor.live = false;
    }
  }
  for (const [actorId, actor] of actors) {
    if (!actor.root && actor.live) failures.push(`trace child actor ${actorId} 缺少 agent.finish`);
  }
  if (events.filter(event => event?.type === 'response.finish' && event.actorId === rootActorId).length !== 1) {
    failures.push('trace root actor 必须精确记录一次 response.finish');
  }
  return failures;
};

const collectValidationBindingFailures = (events, validations) => {
  const failures = [];
  validations.forEach((validation, index) => {
    const validationIndex = index + 1;
    const starts = events.filter(event => event?.type === 'validation.start' && event.validationIndex === validationIndex);
    const finishes = events.filter(event => event?.type === 'validation.finish' && event.validationIndex === validationIndex);
    if (starts.length !== 1 || finishes.length !== 1) {
      failures.push(`trace validation ${validationIndex} 必须精确包含一次 start/finish`);
      return;
    }
    if (starts[0].sequence >= finishes[0].sequence) failures.push(`trace validation ${validationIndex} start 必须早于 finish`);
    if (finishes[0].status !== validation.status) failures.push(`trace validation ${validationIndex} status 必须与 receipt 精确一致`);
  });
  const indexes = events.filter(event => event?.type === 'validation.start' || event?.type === 'validation.finish')
    .map(event => event.validationIndex);
  if (indexes.some(index => !Number.isInteger(index) || index < 1 || index > validations.length)) {
    failures.push('trace validationIndex 不能超出 receipt validations 范围');
  }
  return failures;
};

const collectOperationFailures = (events, label, callType, resultType) => {
  const failures = [];
  const calls = events.filter(event => event?.type === callType);
  const results = events.filter(event => event?.type === resultType);
  for (const call of calls) {
    const matches = results.filter(result => result.operationId === call.operationId);
    if (matches.length !== 1) {
      failures.push(`trace ${label} operation ${call.operationId} 必须精确包含一个 result`);
      continue;
    }
    const result = matches[0];
    if (call.sequence >= result.sequence) failures.push(`trace ${label} operation ${call.operationId} call 必须早于 result`);
    if (call.actorId !== result.actorId || call.name !== result.name) {
      failures.push(`trace ${label} operation ${call.operationId} 的 actor/name 必须前后一致`);
    }
  }
  if (results.some(result => !calls.some(call => call.operationId === result.operationId))) {
    failures.push(`trace ${label} result 不能缺少对应 call`);
  }
  return failures;
};

const evaluateCompleteness = (trace, structureFailures) => {
  const capture = isEvolutionRecord(trace?.capture) ? trace.capture : {};
  const reasons = [];
  if (structureFailures.length > 0) reasons.push('invalid-structure');
  if (capture.status === 'partial') reasons.push('capture.status=partial');
  if (capture.status === 'unknown') reasons.push('capture.status=unknown');
  if (capture.sampling === 'sampled') reasons.push('capture.sampling=sampled');
  if (capture.sampling === 'unknown') reasons.push('capture.sampling=unknown');
  for (const field of ['droppedEvents', 'droppedAttributes', 'droppedLinks']) {
    if (capture[field] > 0) reasons.push(`capture.${field}>0`);
  }
  if (capture.flushStatus === 'failed') reasons.push('capture.flushStatus=failed');
  if (capture.flushStatus === 'unknown') reasons.push('capture.flushStatus=unknown');
  const hasPartial = reasons.some(reason => /partial|sampled|dropped|failed|>0/.test(reason));
  const hasUnknown = reasons.some(reason => /unknown|invalid-structure/.test(reason));
  return { status: hasPartial ? 'partial' : hasUnknown ? 'unknown' : 'complete', reasons };
};

const comparePolicy = (actual, expected) => isEvolutionRecord(actual) && isEvolutionRecord(expected)
  && actual.id === expected.id && actual.version === expected.version && actual.sha256 === expected.sha256;

export const verifyEvolutionTraceReceipt = (receipt, {
  expectedCaseSha256,
  expectedPolicy,
} = {}) => {
  const trace = receipt?.trace;
  const failures = collectObjectFailures(trace, TRACE_FIELDS, 'trace');
  if (isEvolutionRecord(trace)) {
    if (trace.schemaVersion !== 1) failures.push('trace.schemaVersion 必须为 1');
    failures.push(...collectObjectFailures(trace.adapter, ADAPTER_FIELDS, 'trace.adapter'));
    if (isEvolutionRecord(trace.adapter)) {
      if (!matches(trace.adapter.id, ID_PATTERN)) failures.push('trace.adapter.id 非法');
      if (!matches(trace.adapter.version, VERSION_PATTERN)) failures.push('trace.adapter.version 必须是安全版本标识');
    }
    failures.push(...collectObjectFailures(trace.capture, CAPTURE_FIELDS, 'trace.capture'));
    if (isEvolutionRecord(trace.capture)) {
      if (!['complete', 'partial', 'unknown'].includes(trace.capture.status)) failures.push('trace.capture.status 枚举值非法');
      if (!['all', 'sampled', 'unknown'].includes(trace.capture.sampling)) failures.push('trace.capture.sampling 枚举值非法');
      for (const field of ['droppedEvents', 'droppedAttributes', 'droppedLinks']) {
        if (!isNonNegativeInteger(trace.capture[field])) failures.push(`trace.capture.${field} 必须是非负整数`);
      }
      if (!['succeeded', 'failed', 'unknown'].includes(trace.capture.flushStatus)) failures.push('trace.capture.flushStatus 枚举值非法');
    }
    if (!matches(trace.caseSha256, SHA256_PATTERN)) failures.push('trace.caseSha256 必须是小写 SHA-256');
    failures.push(...collectObjectFailures(trace.policy, POLICY_FIELDS, 'trace.policy'));
    if (isEvolutionRecord(trace.policy)) {
      if (!matches(trace.policy.id, ID_PATTERN)) failures.push('trace.policy.id 非法');
      if (!matches(trace.policy.version, VERSION_PATTERN)) failures.push('trace.policy.version 必须是安全版本标识');
      if (!matches(trace.policy.sha256, SHA256_PATTERN)) failures.push('trace.policy.sha256 必须是小写 SHA-256');
    }
    if (!matches(trace.beforeRevision, REVISION_PATTERN)) failures.push('trace.beforeRevision 必须是完整 revision');
    if (!matches(trace.afterRevision, REVISION_PATTERN)) failures.push('trace.afterRevision 必须是完整 revision');
    if (trace.afterRevision !== receipt?.revision) failures.push('trace.afterRevision 必须等于 receipt.revision');
    const events = Array.isArray(trace.events) ? trace.events : [];
    if (!Array.isArray(trace.events) || events.length < 3 || events.length > MAX_EVENTS) failures.push(`trace.events 数量必须在 3 到 ${MAX_EVENTS} 之间`);
    events.forEach((event, index) => failures.push(...collectEventFailures(event, index)));
    failures.push(...collectActorFailures(events));
    failures.push(...collectOperationFailures(events, 'MCP', 'mcp.call', 'mcp.result'));
    failures.push(...collectOperationFailures(events, 'command', 'command.call', 'command.result'));
    failures.push(...collectValidationBindingFailures(events, Array.isArray(receipt?.validations) ? receipt.validations : []));
    failures.push(...collectEvolutionSensitiveFieldFailures(trace, 'trace'));
  }
  const bindings = {
    case: expectedCaseSha256 === undefined ? 'unchecked' : trace?.caseSha256 === expectedCaseSha256 ? 'matched' : 'mismatched',
    policy: expectedPolicy === undefined ? 'unchecked' : comparePolicy(trace?.policy, expectedPolicy) ? 'matched' : 'mismatched',
    revision: trace?.afterRevision === receipt?.revision && matches(trace?.afterRevision, REVISION_PATTERN) ? 'matched' : 'mismatched',
  };
  if (bindings.case === 'mismatched') failures.push('trace.caseSha256 与预期 case digest 不匹配');
  if (bindings.policy === 'mismatched') failures.push('trace.policy 与预期 policy 不匹配');
  const completeness = evaluateCompleteness(trace, failures);
  const integrityEligible = failures.length === 0 && completeness.status === 'complete'
    && bindings.revision === 'matched'
    && Object.values(bindings).every(status => status !== 'mismatched');
  return {
    failures,
    completeness,
    bindings,
    integrityEligible,
    scoringEligible: false,
  };
};
