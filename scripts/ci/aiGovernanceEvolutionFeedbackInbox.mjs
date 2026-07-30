import crypto from 'node:crypto';

import {
  collectEvolutionIsoDateFailures,
  collectEvolutionSensitiveFieldFailures,
  isEvolutionPositiveInteger,
  isEvolutionRecord,
  isEvolutionString,
} from './aiGovernanceEvolutionEvalContract.mjs';
import {
  getEvolutionFeedbackProfile,
  getEvolutionFeedbackProfileByEvidenceCode,
} from './aiGovernanceEvolutionFeedbackProfiles.mjs';
import { readEvolutionFeedbackSource } from './aiGovernanceEvolutionFeedbackSource.mjs';

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
const LEGACY_EVENT_CASE_REFS = new Map([
  ['feedback-skill-evolver-behavior-channel-missing-20260713-opened', {
    eventHash: 'e8d9e8c728cd048e19c60615650548551a1508970e603a0c63446748dd179a75',
    caseRef: { id: 'skill-jsonutils-ai-infra-evolver-trigger', caseVersion: 4, subjectVersion: '0.1.29' },
  }],
]);

const unexpectedFields = (value, allowed, label) => (
  isEvolutionRecord(value)
    ? Object.keys(value).filter(key => !allowed.has(key)).map(key => `${label}: 不允许字段 \`${key}\``)
    : []
);
const sameCaseRef = (left, right) => left?.id === right?.id
  && left?.caseVersion === right?.caseVersion && left?.subjectVersion === right?.subjectVersion;
const isCurrentOrRegisteredHistoricalCaseRef = (event, caseItem) => {
  const legacy = LEGACY_EVENT_CASE_REFS.get(event.id);
  if (legacy) return legacy.eventHash === event.eventHash && sameCaseRef(event.caseRef, legacy.caseRef);
  return Boolean(caseItem && sameCaseRef(event.caseRef, {
    id: caseItem.id, caseVersion: caseItem.caseVersion, subjectVersion: caseItem.subject?.version,
  }));
};

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

const collectFeedbackEventFailures = ({ event, lineNumber, ordinal, previous, casesById, maxDate }) => {
  const label = `feedback-inbox.jsonl: 第 ${lineNumber} 行`;
  if (!isEvolutionRecord(event)) return [`${label} 必须是对象`];
  const failures = unexpectedFields(event, EVENT_FIELDS, label);
  if (![1, 2, 3].includes(event.schemaVersion)) failures.push(`${label}.schemaVersion 必须为 1、2 或 3`);
  if (event.artifactType !== 'ai-evolution-feedback-event') failures.push(`${label}.artifactType 非法`);
  if (event.dataClass !== 'redacted') failures.push(`${label}.dataClass 必须为 redacted`);
  if (!ID_PATTERN.test(event.id ?? '') || !ID_PATTERN.test(event.signalId ?? '')) failures.push(`${label} id/signalId 必须是 kebab-case`);
  if (!isEvolutionPositiveInteger(event.sequence) || event.sequence !== ordinal) failures.push(`${label}.sequence 必须等于物理非空行序`);
  const expectedPrevious = previous?.eventHash ?? null;
  if (event.previousHash !== expectedPrevious) failures.push(`${label}.previousHash 必须绑定直接前一事件`);
  if (!EVENT_TYPES.has(event.eventType)) failures.push(`${label}.eventType 枚举值非法`);
  failures.push(...collectEvolutionIsoDateFailures(`${label}.observedAt`, event.observedAt, maxDate));
  if (event.source !== 'live-agent-observation') failures.push(`${label}.source 当前只允许 live-agent-observation`);
  failures.push(...unexpectedFields(event.caseRef, CASE_FIELDS, `${label}.caseRef`));
  const caseItem = casesById.get(event.caseRef?.id);
  const caseRefAccepted = isCurrentOrRegisteredHistoricalCaseRef(event, caseItem);
  if (!caseRefAccepted) {
    failures.push(`${label}.caseRef 必须绑定当前版本或 event hash 登记的精确历史版本`);
  }
  if (event.schemaVersion === 3) {
    if (event.experimentId !== null) failures.push(`${label}.experimentId 必须为 null`);
    if (caseItem && caseItem.coverageClass !== 'behavior') failures.push(`${label}.caseRef v3 必须绑定 behavior case`);
  } else if (!isEvolutionString(event.experimentId)) failures.push(`${label}.experimentId 不能为空`);
  failures.push(...unexpectedFields(event.evidence, EVIDENCE_FIELDS, `${label}.evidence`));
  const evidenceProfile = getEvolutionFeedbackProfileByEvidenceCode(event.evidence?.code);
  if (!evidenceProfile || event.schemaVersion !== evidenceProfile.schemaVersion
    || event.evidence?.surface !== evidenceProfile.evidence.surface
    || event.evidence?.scope !== evidenceProfile.evidence.scope) failures.push(`${label}.evidence 必须使用版本允许的固定脱敏观察码`);
  if (evidenceProfile && caseRefAccepted && evidenceProfile.caseId !== null && (
    event.caseRef?.id !== evidenceProfile.caseId || event.experimentId !== evidenceProfile.experimentId
  )) failures.push(`${label}.profile 必须绑定固定 case 和 experiment`);
  if (event.disposition !== 'open') failures.push(`${label} 当前 schema 只接受 open disposition；关闭需后续显式 schema`);
  failures.push(...falseOnly(event.claims, CLAIM_FIELDS, `${label}.claims`));
  failures.push(...falseOnly(event.privacy, PRIVACY_FIELDS, `${label}.privacy`));
  if (!HASH_PATTERN.test(event.eventHash ?? '') || event.eventHash !== computeEvolutionFeedbackEventHash(event)) {
    failures.push(`${label}.eventHash 与精确紧凑事件不一致`);
  }
  failures.push(...collectEvolutionSensitiveFieldFailures(event, label));
  return failures;
};

export const readEvolutionFeedbackInbox = (filePath, { casesById, maxDate }) => {
  const source = readEvolutionFeedbackSource(filePath);
  const events = source.entries.filter(entry => entry.parsed).map(entry => entry.event);
  const failures = [...source.failures];
  let previous = null;
  source.entries.forEach(({ event, parsed, lineNumber, ordinal }) => {
    if (!parsed) return;
    failures.push(...collectFeedbackEventFailures({
      event, lineNumber, ordinal, previous, casesById, maxDate,
    }));
    previous = event;
  });
  const recordEvents = events.filter(isEvolutionRecord);
  const ids = recordEvents.map(event => event.id);
  if (new Set(ids).size !== ids.length) failures.push('feedback-inbox.jsonl: event id 必须唯一');
  const signalIds = recordEvents.map(event => event.signalId);
  if (new Set(signalIds).size !== signalIds.length) failures.push('feedback-inbox.jsonl: signalId 必须唯一');
  const validEvents = failures.length === 0 ? events : [];
  const states = new Map();
  validEvents.forEach(event => states.set(event.signalId, event));
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

const buildFeedbackCandidate = ({
  existingEvents, observedAt, caseItem, experimentId, profileId,
}) => {
  const evidenceProfile = getEvolutionFeedbackProfile(profileId);
  if (!evidenceProfile) throw new Error(`feedback profile \`${profileId}\` 不存在`);
  if (evidenceProfile.caseId !== null && (
    caseItem?.id !== evidenceProfile.caseId || experimentId !== evidenceProfile.experimentId
  )) throw new Error('feedback profile 必须绑定固定 case 和 experiment');
  if (evidenceProfile.caseId === null && experimentId !== null) {
    throw new Error('feedback profile 必须绑定固定 case 和 experiment');
  }
  if (evidenceProfile.schemaVersion === 3 && caseItem?.coverageClass !== 'behavior') {
    throw new Error('maintainer correction 只允许绑定 behavior case');
  }
  const signalPrefix = evidenceProfile.caseId === null
    ? `${evidenceProfile.signalPrefix}-${caseItem?.id ?? 'missing-case'}`
    : evidenceProfile.signalPrefix;
  const signalId = `${signalPrefix}-${observedAt.replaceAll('-', '')}`;
  if (existingEvents.some(event => event.signalId === signalId)) throw new Error(`feedback signal \`${signalId}\` 已存在`);
  const event = {
    schemaVersion: evidenceProfile.schemaVersion,
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
    evidence: { ...evidenceProfile.evidence },
    disposition: 'open',
    claims: { modelInvoked: false, automaticLedgerWrites: false, outcomeEligible: false },
    privacy: { promptStored: false, reasoningStored: false, toolPayloadStored: false, authMaterialStored: false },
  };
  return { ...event, eventHash: computeEvolutionFeedbackEventHash(event) };
};

export const buildMcpRegistrationFeedbackCandidate = input => buildFeedbackCandidate({
  ...input, profileId: 'mcp-server-unregistered',
});

export const buildBehaviorEvidenceFeedbackCandidate = input => buildFeedbackCandidate({
  ...input, profileId: 'skill-behavior-channel-missing',
});

export const buildMaintainerCorrectionFeedbackCandidate = input => buildFeedbackCandidate({
  ...input, experimentId: null, profileId: 'maintainer-correction',
});

export const buildEvolutionFeedbackCandidateForProfile = input => buildFeedbackCandidate({
  ...input, profileId: input.profile,
});
