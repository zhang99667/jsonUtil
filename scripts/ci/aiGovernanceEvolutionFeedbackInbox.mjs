import crypto from 'node:crypto';
import fs from 'node:fs';

import {
  collectEvolutionIsoDateFailures,
  collectEvolutionSensitiveFieldFailures,
  isEvolutionPositiveInteger,
  isEvolutionRecord,
  isEvolutionString,
} from './aiGovernanceEvolutionEvalContract.mjs';

const ID_PATTERN = /^[a-z][a-z0-9-]*$/;
const HASH_PATTERN = /^[a-f0-9]{64}$/;
const EVENT_FIELDS = new Set([
  'schemaVersion', 'id', 'artifactType', 'dataClass', 'sequence', 'previousHash', 'signalId',
  'eventType', 'observedAt', 'source', 'caseRef', 'experimentId', 'evidence', 'disposition',
  'claims', 'privacy', 'eventHash',
]);
const CASE_FIELDS = new Set(['id', 'caseVersion', 'subjectVersion']);
const EVIDENCE_FIELDS = new Set(['code', 'surface', 'scope']);
const CLAIM_FIELDS = new Set(['modelInvoked', 'automaticLedgerWrites', 'outcomeEligible']);
const PRIVACY_FIELDS = new Set(['promptStored', 'reasoningStored', 'toolPayloadStored', 'authMaterialStored']);
const EVENT_TYPES = new Set(['opened']);

const unexpectedFields = (value, allowed, label) => (
  isEvolutionRecord(value)
    ? Object.keys(value).filter(key => !allowed.has(key)).map(key => `${label}: 不允许字段 \`${key}\``)
    : []
);

export const computeEvolutionFeedbackEventHash = (event) => {
  const { eventHash: _eventHash, ...payload } = event;
  return crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex');
};

const falseOnly = (value, fields, label) => {
  const failures = unexpectedFields(value, fields, label);
  if (!isEvolutionRecord(value)) return [...failures, `${label} 必须是对象`];
  for (const field of fields) if (value[field] !== false) failures.push(`${label}.${field} 必须为 false`);
  return failures;
};

const collectFeedbackEventFailures = ({ event, index, previous, casesById, maxDate }) => {
  const label = `feedback-inbox.jsonl: 第 ${index + 1} 行`;
  if (!isEvolutionRecord(event)) return [`${label} 必须是对象`];
  const failures = unexpectedFields(event, EVENT_FIELDS, label);
  if (event.schemaVersion !== 1) failures.push(`${label}.schemaVersion 必须为 1`);
  if (event.artifactType !== 'ai-evolution-feedback-event') failures.push(`${label}.artifactType 非法`);
  if (event.dataClass !== 'redacted') failures.push(`${label}.dataClass 必须为 redacted`);
  if (!ID_PATTERN.test(event.id ?? '') || !ID_PATTERN.test(event.signalId ?? '')) failures.push(`${label} id/signalId 必须是 kebab-case`);
  if (!isEvolutionPositiveInteger(event.sequence) || event.sequence !== index + 1) failures.push(`${label}.sequence 必须等于物理非空行序`);
  const expectedPrevious = previous?.eventHash ?? null;
  if (event.previousHash !== expectedPrevious) failures.push(`${label}.previousHash 必须绑定直接前一事件`);
  if (!EVENT_TYPES.has(event.eventType)) failures.push(`${label}.eventType 枚举值非法`);
  failures.push(...collectEvolutionIsoDateFailures(`${label}.observedAt`, event.observedAt, maxDate));
  if (event.source !== 'live-agent-observation') failures.push(`${label}.source 当前只允许 live-agent-observation`);
  failures.push(...unexpectedFields(event.caseRef, CASE_FIELDS, `${label}.caseRef`));
  const caseItem = casesById.get(event.caseRef?.id);
  if (!caseItem || event.caseRef?.caseVersion !== caseItem.caseVersion || event.caseRef?.subjectVersion !== caseItem.subject?.version) {
    failures.push(`${label}.caseRef 必须绑定当前 case/subject 版本`);
  }
  if (!isEvolutionString(event.experimentId)) failures.push(`${label}.experimentId 不能为空`);
  failures.push(...unexpectedFields(event.evidence, EVIDENCE_FIELDS, `${label}.evidence`));
  if (event.evidence?.code !== 'unknown-mcp-server' || event.evidence?.surface !== 'codex-task-registry'
    || event.evidence?.scope !== 'self-observed-unverified') failures.push(`${label}.evidence 必须使用固定脱敏观察码`);
  if (event.disposition !== 'open') failures.push(`${label} v1 只接受 open disposition；关闭需后续显式 schema`);
  failures.push(...falseOnly(event.claims, CLAIM_FIELDS, `${label}.claims`));
  failures.push(...falseOnly(event.privacy, PRIVACY_FIELDS, `${label}.privacy`));
  if (!HASH_PATTERN.test(event.eventHash ?? '') || event.eventHash !== computeEvolutionFeedbackEventHash(event)) {
    failures.push(`${label}.eventHash 与精确紧凑事件不一致`);
  }
  failures.push(...collectEvolutionSensitiveFieldFailures(event, label));
  return failures;
};

export const readEvolutionFeedbackInbox = (filePath, { casesById, maxDate }) => {
  let text;
  try {
    text = fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    return { events: [], validEvents: [], failures: [`feedback-inbox.jsonl: 无法读取（${error.message}）`], chain: { status: 'invalid', events: 0, headSequence: null, headHash: null } };
  }
  const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
  const events = [];
  const failures = [];
  lines.forEach((line, index) => {
    let event;
    try { event = JSON.parse(line); } catch (error) {
      failures.push(`feedback-inbox.jsonl: 第 ${index + 1} 行无法解析 JSON（${error.message}）`);
      return;
    }
    events.push(event);
    if (line !== JSON.stringify(event)) failures.push(`feedback-inbox.jsonl: 第 ${index + 1} 行必须是精确紧凑 JSON`);
    failures.push(...collectFeedbackEventFailures({ event, index, previous: events[index - 1], casesById, maxDate }));
  });
  const ids = events.map(event => event.id);
  if (new Set(ids).size !== ids.length) failures.push('feedback-inbox.jsonl: event id 必须唯一');
  const states = new Map();
  events.forEach(event => states.set(event.signalId, event));
  const validEvents = failures.length === 0 ? events : [];
  return {
    events,
    validEvents,
    states,
    failures,
    chain: {
      status: failures.length > 0 ? 'invalid' : events.length > 0 ? 'valid' : 'empty',
      events: events.length,
      headSequence: events.at(-1)?.sequence ?? null,
      headHash: events.at(-1)?.eventHash ?? null,
    },
  };
};

export const buildMcpRegistrationFeedbackCandidate = ({ existingEvents, observedAt, caseItem, experimentId }) => {
  const signalId = `mcp-project-registration-unavailable-${observedAt.replaceAll('-', '')}`;
  if (existingEvents.some(event => event.signalId === signalId)) throw new Error(`feedback signal \`${signalId}\` 已存在`);
  const event = {
    schemaVersion: 1,
    id: `feedback-${signalId}-opened`,
    artifactType: 'ai-evolution-feedback-event',
    dataClass: 'redacted',
    sequence: existingEvents.length + 1,
    previousHash: existingEvents.at(-1)?.eventHash ?? null,
    signalId,
    eventType: 'opened',
    observedAt,
    source: 'live-agent-observation',
    caseRef: { id: caseItem.id, caseVersion: caseItem.caseVersion, subjectVersion: caseItem.subject.version },
    experimentId,
    evidence: { code: 'unknown-mcp-server', surface: 'codex-task-registry', scope: 'self-observed-unverified' },
    disposition: 'open',
    claims: { modelInvoked: false, automaticLedgerWrites: false, outcomeEligible: false },
    privacy: { promptStored: false, reasoningStored: false, toolPayloadStored: false, authMaterialStored: false },
  };
  return { ...event, eventHash: computeEvolutionFeedbackEventHash(event) };
};
