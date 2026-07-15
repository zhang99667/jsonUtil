import {
  collectEvolutionSensitiveFieldFailures,
  isEvolutionRecord,
} from './aiGovernanceEvolutionEvalContract.mjs';

export const AI_EVOLUTION_UNVERIFIED_TRACE_OBSERVATION_MAX_BYTES = 64 * 1024;
const OBSERVATION_FIELDS = ['schemaVersion', 'artifactType', 'dataClass', 'caseId', 'method', 'trace'];
const TRACE_INPUT_FIELDS = ['adapter', 'capture', 'events'];
const ADAPTER_INPUT_FIELDS = ['id', 'version'];
const CAPTURE_INPUT_FIELDS = ['status', 'sampling', 'droppedEvents', 'droppedAttributes', 'droppedLinks', 'flushStatus'];
const EVENT_INPUT_FIELDS = new Set([
  'sequence', 'type', 'actorId', 'childActorId', 'operationId', 'name', 'status', 'path',
  'sha256', 'beforeSha256', 'afterSha256', 'validationIndex', 'keys',
]);
const METHODS = new Set(['model', 'human', 'hybrid']);
const CASE_ID_PATTERN = /^[a-z][a-z0-9-]*$/;
const MAX_INPUT_EVENTS = 198;

const exactFields = (value, fields, label) => {
  if (!isEvolutionRecord(value)) throw new TypeError(`${label} 必须是对象`);
  const actual = Object.keys(value).sort();
  const expected = [...fields].sort();
  if (JSON.stringify(actual) !== JSON.stringify(expected)) throw new TypeError(`${label} 必须是闭字段对象`);
};

const rejectUnexpectedFields = (value, fields, label) => {
  if (!isEvolutionRecord(value)) throw new TypeError(`${label} 必须是对象`);
  if (Object.keys(value).some(field => !fields.has(field))) throw new TypeError(`${label} 包含非法字段`);
};

export const normalizeEvolutionUnverifiedTraceObservation = (observation) => {
  exactFields(observation, OBSERVATION_FIELDS, 'trace observation');
  exactFields(observation.trace, TRACE_INPUT_FIELDS, 'trace observation.trace');
  const sensitive = collectEvolutionSensitiveFieldFailures(observation, 'trace observation');
  if (sensitive.length > 0) throw new TypeError(sensitive[0]);
  exactFields(observation.trace.adapter, ADAPTER_INPUT_FIELDS, 'trace observation.trace.adapter');
  exactFields(observation.trace.capture, CAPTURE_INPUT_FIELDS, 'trace observation.trace.capture');
  if (observation.schemaVersion !== 1
    || observation.artifactType !== 'ai-evolution-unverified-trace-observation'
    || observation.dataClass !== 'redacted'
    || !CASE_ID_PATTERN.test(observation.caseId ?? '')
    || !METHODS.has(observation.method)) {
    throw new TypeError('trace observation 基础字段非法');
  }
  const events = observation.trace.events;
  if (!Array.isArray(events) || events.length < 3 || events.length > MAX_INPUT_EVENTS) {
    throw new TypeError(`trace observation.events 数量必须在 3 到 ${MAX_INPUT_EVENTS} 之间`);
  }
  for (let index = 0; index < events.length; index += 1) {
    if (!Object.hasOwn(events, index)) throw new TypeError('trace observation event 必须是对象');
    const event = events[index];
    rejectUnexpectedFields(event, EVENT_INPUT_FIELDS, `trace observation.trace.events[${index}]`);
    if (!isEvolutionRecord(event) || event.sequence !== index + 1) {
      throw new TypeError('trace observation event 必须从 1 连续递增');
    }
    if (['validation.start', 'validation.finish'].includes(event.type)) {
      throw new TypeError('trace observation 不接受调用方提供 validation 事件');
    }
  }
  let compact;
  try { compact = JSON.stringify(observation); } catch { throw new TypeError('trace observation 不是合法 JSON 值'); }
  if (!compact || Buffer.byteLength(compact, 'utf8') > AI_EVOLUTION_UNVERIFIED_TRACE_OBSERVATION_MAX_BYTES) {
    throw new TypeError('trace observation 超过 64 KiB 上限');
  }
  return JSON.parse(compact);
};

export const parseEvolutionUnverifiedTraceObservation = (text) => {
  if (typeof text !== 'string' || text.length === 0
    || Buffer.byteLength(text, 'utf8') > AI_EVOLUTION_UNVERIFIED_TRACE_OBSERVATION_MAX_BYTES) {
    throw new TypeError('trace observation stdin 为空或超过 64 KiB 上限');
  }
  let observation;
  try { observation = JSON.parse(text); } catch { throw new TypeError('trace observation stdin 不是合法 JSON'); }
  if (text !== JSON.stringify(observation)) throw new TypeError('trace observation stdin 必须是精确紧凑 JSON');
  return normalizeEvolutionUnverifiedTraceObservation(observation);
};
