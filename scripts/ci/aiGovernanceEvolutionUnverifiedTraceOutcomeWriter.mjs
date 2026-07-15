import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { getLocalIsoDate } from './aiGovernanceDateBounds.mjs';
import { validateEvolutionDeterministicOutcomeCandidate } from './aiGovernanceEvolutionDeterministicOutcomeWriter.mjs';
import {
  acquireEvolutionOutcomeWriterLock,
  commitEvolutionOutcomeTransaction,
  readEvolutionOutcomeLedgerSnapshot,
  recoverEvolutionOutcomeTransaction,
} from './aiGovernanceEvolutionDeterministicOutcomeTransaction.mjs';
import {
  collectEvolutionSensitiveFieldFailures,
  isEvolutionRecord,
  readEvolutionEvalCorpus,
} from './aiGovernanceEvolutionEvalContract.mjs';
import { buildAiGovernanceEvolutionEvalReport } from './aiGovernanceEvolutionEvalReport.mjs';
import {
  hashEvolutionOutcomeLegacyPrefix,
  hashEvolutionOutcomeV3Line,
} from './aiGovernanceEvolutionOutcomeChain.mjs';
import { readEvolutionOutcomeLedger } from './aiGovernanceEvolutionOutcomeLedger.mjs';
import { hashEvolutionTraceValue, verifyEvolutionTraceReceipt } from './aiGovernanceEvolutionTrace.mjs';
import {
  buildEvolutionTracePolicyRegistry,
  verifyRegisteredEvolutionTracePolicy,
} from './aiGovernanceEvolutionTracePolicies.mjs';
import {
  hashEvolutionTrialReceiptLine,
  readEvolutionTrialReceiptLedger,
} from './aiGovernanceEvolutionTrialReceipts.mjs';
import { resolveEvolutionWorktreeRevision } from './aiGovernanceEvolutionWorktreeRevision.mjs';

export const AI_EVOLUTION_UNVERIFIED_TRACE_OUTCOME_WRITER_VERSION = '1.0.0';
export const AI_EVOLUTION_UNVERIFIED_TRACE_OBSERVATION_MAX_BYTES = 64 * 1024;
const RECEIPTS_RELATIVE_PATH = 'evals/ai-governance/trial-receipts.jsonl';
const OUTCOMES_RELATIVE_PATH = 'evals/ai-governance/outcomes.jsonl';
const VALIDATION_COMMAND = 'internal:verify-unverified-trace-candidate@1';
const OBSERVATION_FIELDS = ['schemaVersion', 'artifactType', 'dataClass', 'caseId', 'method', 'trace'];
const TRACE_INPUT_FIELDS = ['adapter', 'capture', 'events'];
const ADAPTER_INPUT_FIELDS = ['id', 'version'];
const CAPTURE_INPUT_FIELDS = ['status', 'sampling', 'droppedEvents', 'droppedAttributes', 'droppedLinks', 'flushStatus'];
const EVENT_INPUT_FIELDS = new Set(['sequence', 'type', 'actorId', 'childActorId', 'operationId', 'name', 'status', 'path', 'sha256', 'beforeSha256', 'afterSha256', 'validationIndex', 'keys']);
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

const normalizeObservation = (observation) => {
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
  events.forEach((event, index) => {
    rejectUnexpectedFields(event, EVENT_INPUT_FIELDS, `trace observation.trace.events[${index}]`);
    if (!isEvolutionRecord(event) || event.sequence !== index + 1) {
      throw new TypeError('trace observation event 必须从 1 连续递增');
    }
    if (['validation.start', 'validation.finish'].includes(event.type)) {
      throw new TypeError('trace observation 不接受调用方提供 validation 事件');
    }
  });
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
  return normalizeObservation(observation);
};

const appendJsonLine = (base, line) => {
  const separator = base.length > 0 && base.at(-1) !== 0x0a ? '\n' : '';
  return Buffer.from(`${separator}${line}\n`, 'utf8');
};

const lineageKey = value => JSON.stringify([value.caseId, value.caseVersion, value.subjectVersion]);
const latestLineageOutcomes = (outcomes) => {
  const latest = new Map();
  outcomes.forEach(outcome => latest.set(lineageKey(outcome), outcome));
  return latest;
};

const withPrivateLedgerCopies = ({ receiptsBytes, outcomesBytes }, callback) => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'jsonutils-unverified-trace-preview-'));
  fs.chmodSync(tempDir, 0o700);
  const receiptsPath = path.join(tempDir, 'trial-receipts.jsonl');
  const outcomesPath = path.join(tempDir, 'outcomes.jsonl');
  try {
    fs.writeFileSync(receiptsPath, receiptsBytes, { mode: 0o600, flag: 'wx' });
    fs.writeFileSync(outcomesPath, outcomesBytes, { mode: 0o600, flag: 'wx' });
    return callback({ receiptsPath, outcomesPath });
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
};

const readValidatedState = ({ rootDir, corpus, evaluatedAt, receiptsBytes, outcomesBytes }) => (
  withPrivateLedgerCopies({ receiptsBytes, outcomesBytes }, ({ receiptsPath, outcomesPath }) => {
    const receiptResult = readEvolutionTrialReceiptLedger(receiptsPath, { rootDir, maxDate: evaluatedAt });
    if (receiptResult.failures.length > 0) throw new Error(`receipt ledger 校验失败：${receiptResult.failures[0]}`);
    const outcomeResult = readEvolutionOutcomeLedger(outcomesPath, {
      caseIds: new Set([...corpus.cases.map(item => item.id), ...corpus.retiredCaseIds]),
      maxDate: evaluatedAt,
      rootDir,
      receiptsById: receiptResult.receiptsById,
      currentCorpusVersion: corpus.corpus.corpusVersion,
    });
    if (outcomeResult.failures.length > 0) throw new Error(`outcome ledger 校验失败：${outcomeResult.failures[0]}`);
    return { receiptResult, outcomeResult };
  })
);

const assertDistinctSnapshots = (receipts, outcomes) => {
  if (receipts.endpoint.dev === outcomes.endpoint.dev && receipts.endpoint.ino === outcomes.endpoint.ino) {
    throw new Error('receipt/outcome ledger 不得指向同一 inode');
  }
};

const assertSnapshotUnchanged = (before, after, label) => {
  const sameEndpoint = Object.keys(before.endpoint).every(field => before.endpoint[field] === after.endpoint[field]);
  if (before.absolute !== after.absolute || !sameEndpoint || !before.bytes.equals(after.bytes)) {
    throw new Error(`${label} 在 preview 期间发生漂移`);
  }
};

const buildTrace = ({ observation, caseItem, policyEntry, revision }) => {
  const inputEvents = observation.trace.events;
  const finalEvent = inputEvents.at(-1);
  const actorId = inputEvents[0]?.actorId;
  const events = [
    ...inputEvents.slice(0, -1),
    { type: 'validation.start', actorId, validationIndex: 1, status: 'started' },
    { type: 'validation.finish', actorId, validationIndex: 1, status: 'passed' },
    finalEvent,
  ].map((event, index) => ({ ...event, sequence: index + 1 }));
  return {
    schemaVersion: 1,
    adapter: observation.trace.adapter,
    capture: observation.trace.capture,
    caseSha256: hashEvolutionTraceValue(caseItem),
    policy: policyEntry.descriptor,
    beforeRevision: revision,
    afterRevision: revision,
    events,
  };
};

const buildValidation = evaluatedAt => ({
  command: VALIDATION_COMMAND,
  status: 'passed',
  evidence: 'writer 已执行固定 trace 结构与注册 policy；revision 只绑定本地 authoring 窗口，不证明原始执行身份、环境或时间',
  checkedAt: evaluatedAt,
});

const confirmedProjection = report => ({
  counts: Object.fromEntries([
    'outcomes', 'activeLatestOutcomes', 'fixedReplayVerifiedOutcomes', 'traceVerifiedOutcomes',
    'pass', 'partial', 'fail', 'coveredCases', 'uncoveredCases',
  ].map(key => [key, report.counts[key]])),
  coverage: report.coverage.outcomes,
  scoredOutcomeIds: report.scoredOutcomeIds,
  fixedReplayVerifiedOutcomeIds: report.fixedReplayVerifiedOutcomeIds,
  traceVerifiedOutcomeIds: report.traceVerifiedOutcomeIds,
  traceVerification: report.traceVerification,
});

const assertCandidateSafety = ({ base, candidate, outcome, outcomeLine, previous }) => {
  if (!base?.ok || !candidate?.ok) throw new Error(`候选 ledger 全量校验失败：${candidate?.failures?.[0] ?? '报告不完整'}`);
  if (JSON.stringify(confirmedProjection(base)) !== JSON.stringify(confirmedProjection(candidate))) {
    throw new Error('unverified trace 候选改变了 confirmed/coverage/scored 事实');
  }
  const countDelta = (key, expected) => {
    if (candidate.counts[key] - base.counts[key] !== expected) throw new Error(`候选 ${key} 增量非法`);
  };
  ['totalOutcomes', 'validOutcomes', 'trialReceipts', 'validTrialReceipts', 'chainedOutcomes', 'historyOutcomes']
    .forEach(key => countDelta(key, 1));
  ['invalidOutcomes', 'invalidTrialReceipts'].forEach(key => countDelta(key, 0));
  const previousWasUnverified = previous ? base.unverifiedOutcomeIds.includes(previous.id) : false;
  const previousWasTraceBound = previous ? base.traceBoundOutcomeIds.includes(previous.id) : false;
  countDelta('recordedActiveOutcomes', previous ? 0 : 1);
  countDelta('supersededOutcomes', previous ? 1 : 0);
  countDelta('traceBoundOutcomes', previousWasTraceBound ? 0 : 1);
  countDelta('traceBoundUnverifiedOutcomes', previousWasTraceBound ? 0 : 1);
  countDelta('unverifiedOutcomes', previousWasUnverified ? 0 : 1);
  for (const verdict of ['Pass', 'Partial', 'Fail']) {
    const expected = (verdict === 'Pass' ? 1 : 0)
      - (previousWasUnverified && previous.verdict === verdict.toLowerCase() ? 1 : 0);
    countDelta(`unverified${verdict}`, expected);
  }
  if (!candidate.traceBoundOutcomeIds.includes(outcome.id)
    || !candidate.unverifiedOutcomeIds.includes(outcome.id)
    || candidate.scoredOutcomeIds.includes(outcome.id)
    || candidate.traceVerifiedOutcomeIds.includes(outcome.id)
    || candidate.fixedReplayVerifiedOutcomeIds.includes(outcome.id)) {
    throw new Error('候选 outcome 必须且只能进入 trace-bound-unverified 集合');
  }
  if (candidate.ledgerChain.headSequence !== base.ledgerChain.headSequence + 1
    || candidate.ledgerChain.headSha256 !== hashEvolutionOutcomeV3Line(outcomeLine)) {
    throw new Error('候选 outcome chain head 不匹配');
  }
};

const currentTraceIsReusable = ({ previous, receiptResult, observation, trace, baseReport }) => {
  if (!previous || !baseReport.unverifiedOutcomeIds.includes(previous.id)
    || !baseReport.traceBoundOutcomeIds.includes(previous.id)) return false;
  const receipt = receiptResult.receiptsById.get(previous.evidence?.receiptId)?.receipt;
  return receipt?.schemaVersion === 2 && receipt.method === observation.method
    && receipt.source === 'manual' && receipt.revision === trace.afterRevision
    && receipt.runner === `${trace.adapter.id}@${trace.adapter.version}`
    && hashEvolutionTraceValue(receipt.trace) === hashEvolutionTraceValue(trace);
};

export const prepareEvolutionUnverifiedTraceOutcome = ({
  rootDir,
  observation,
  evaluatedAt = getLocalIsoDate(),
  resolveRevision = resolveEvolutionWorktreeRevision,
  validateCandidate = validateEvolutionDeterministicOutcomeCandidate,
} = {}) => {
  const normalized = normalizeObservation(observation);
  const realRoot = fs.realpathSync(rootDir);
  const receiptsPath = path.join(realRoot, RECEIPTS_RELATIVE_PATH);
  const outcomesPath = path.join(realRoot, OUTCOMES_RELATIVE_PATH);
  const corpus = readEvolutionEvalCorpus(path.join(realRoot, 'evals/ai-governance/cases.json'), { maxDate: evaluatedAt });
  if (corpus.failures.length > 0) throw new Error(`eval corpus 校验失败：${corpus.failures[0]}`);
  const caseItem = corpus.cases.find(item => item.id === normalized.caseId);
  if (!caseItem || caseItem.coverageClass !== 'behavior') throw new Error('trace observation 只能引用当前 behavior case');
  const policies = buildEvolutionTracePolicyRegistry({ rootDir: realRoot });
  if (policies.failures.length > 0) throw new Error(`trace policy registry 校验失败：${policies.failures[0]}`);
  const policyEntry = policies.policiesByCaseId.get(caseItem.id);
  if (!policyEntry) throw new Error('trace observation case 缺少注册 policy');
  const receiptsBefore = readEvolutionOutcomeLedgerSnapshot(realRoot, receiptsPath);
  const outcomesBefore = readEvolutionOutcomeLedgerSnapshot(realRoot, outcomesPath);
  assertDistinctSnapshots(receiptsBefore, outcomesBefore);
  const revision = resolveRevision(realRoot);
  const state = readValidatedState({
    rootDir: realRoot, corpus, evaluatedAt,
    receiptsBytes: receiptsBefore.bytes, outcomesBytes: outcomesBefore.bytes,
  });
  const baseReport = validateCandidate({
    rootDir: realRoot, receiptsBytes: receiptsBefore.bytes, outcomesBytes: outcomesBefore.bytes,
    evaluatedAt, revision,
  });
  const previous = latestLineageOutcomes(state.outcomeResult.validOutcomes).get(lineageKey({
    caseId: caseItem.id, caseVersion: caseItem.caseVersion, subjectVersion: caseItem.subject.version,
  }));
  if (state.outcomeResult.validOutcomes.some(item => item.caseId === caseItem.id && baseReport.scoredOutcomeIds.includes(item.id))) {
    throw new Error('已有 confirmed current outcome，禁止用 unverified trace 覆盖');
  }
  if (previous && !baseReport.unverifiedOutcomeIds.includes(previous.id)) {
    throw new Error('当前 lineage 不是可安全接续的 unverified outcome');
  }
  const trace = buildTrace({ observation: normalized, caseItem, policyEntry, revision });
  const validation = buildValidation(evaluatedAt);
  const provisionalReceipt = { revision, validations: [validation], trace };
  const traceVerification = verifyEvolutionTraceReceipt(provisionalReceipt, {
    expectedCaseSha256: trace.caseSha256, expectedPolicy: policyEntry.descriptor,
  });
  const policyVerification = verifyRegisteredEvolutionTracePolicy(policyEntry, trace);
  if (!traceVerification.integrityEligible || policyVerification.status !== 'verified') {
    throw new Error(`trace observation 未通过固定验证：${traceVerification.failures[0] ?? policyVerification.failures[0] ?? 'capture 不完整'}`);
  }
  if (currentTraceIsReusable({ previous, receiptResult: state.receiptResult, observation: normalized, trace, baseReport })) {
    return {
      report: {
        schemaVersion: 1, reportType: 'ai-evolution-unverified-trace-outcome-writer',
        writerVersion: AI_EVOLUTION_UNVERIFIED_TRACE_OUTCOME_WRITER_VERSION,
        ok: true, mode: 'preview', status: 'already-current', evidenceStatus: 'trace-bound-unverified',
        caseId: caseItem.id, corpusVersion: corpus.corpus.corpusVersion, revision,
        traceSha256: hashEvolutionTraceValue(trace),
        candidate: { receiptId: previous.evidence.receiptId, outcomeId: previous.id, sequence: previous.chain.sequence },
        counts: { candidates: 0, alreadyCurrent: 1, confirmedDelta: 0 },
        confirmedCoverageEligible: false, ledgerMutationRequested: false, ledgerMutationPerformed: false,
      },
      transaction: {
        revision, receiptsPath, outcomesPath,
        receiptsBase: receiptsBefore.bytes, outcomesBase: outcomesBefore.bytes,
        receiptSuffix: Buffer.alloc(0), outcomeSuffix: Buffer.alloc(0),
      },
    };
  }
  const sequence = state.outcomeResult.outcomes.length + 1;
  const suffix = `${evaluatedAt}-s${sequence}`;
  const receiptId = `receipt-${caseItem.id}-trace-v${caseItem.caseVersion}-${suffix}`;
  const outcomeId = `${caseItem.id}-trace-v${caseItem.caseVersion}-${suffix}`;
  if (state.receiptResult.receiptsById.has(receiptId)
    || state.outcomeResult.outcomes.some(item => item.id === outcomeId)) throw new Error('unverified trace writer id 冲突');
  const runner = `${trace.adapter.id}@${trace.adapter.version}`;
  const receipt = {
    schemaVersion: 2, id: receiptId, artifactType: 'ai-evolution-trial-receipt', dataClass: 'redacted',
    caseId: caseItem.id, corpusVersion: corpus.corpus.corpusVersion, caseVersion: caseItem.caseVersion,
    subjectVersion: caseItem.subject.version, evaluatedAt, method: normalized.method, source: 'manual',
    runner, revision, aggregation: 'all-pass',
    trialResults: [{
      trial: 1, verdict: 'pass', score: 100, gradeTarget: 'trace',
      evidence: '闭字段 observation 通过固定 trace policy；无外部 proof，原始执行身份、环境与时间未验信',
    }],
    validations: [validation], trace,
  };
  const receiptLine = JSON.stringify(receipt);
  if (Buffer.byteLength(receiptLine, 'utf8') > 64 * 1024) throw new Error('派生 receipt 超过 64 KiB 上限');
  const outcomeLines = outcomesBefore.bytes.toString('utf8').split(/\r?\n/).filter(line => line.trim());
  const previousV3Line = state.outcomeResult.outcomes.at(-1)?.schemaVersion === 3 ? outcomeLines.at(-1) : null;
  const outcome = {
    schemaVersion: 3, id: outcomeId, caseId: caseItem.id, corpusVersion: corpus.corpus.corpusVersion,
    caseVersion: caseItem.caseVersion, subjectVersion: caseItem.subject.version, evaluatedAt,
    verdict: 'pass', score: 100,
    provenance: { method: normalized.method, source: 'manual', runner, revision, trials: 1 },
    evidence: { receiptId, sha256: hashEvolutionTrialReceiptLine(receiptLine) },
    writeback: { files: [], validationResults: [validation] },
    chain: {
      sequence,
      previousHash: previousV3Line === null
        ? hashEvolutionOutcomeLegacyPrefix(outcomeLines) : hashEvolutionOutcomeV3Line(previousV3Line),
    },
    supersession: {
      previousOutcomeId: previous?.id ?? null,
      feedbackDisposition: previous && ['fail', 'partial'].includes(previous.verdict) ? 'resolved' : 'none',
      summary: previous
        ? '当前闭字段 trace observation 通过固定 policy，显式接续同 lineage 未验信前序'
        : '首次记录当前 lineage 的 trace-bound-unverified observation',
    },
  };
  const outcomeLine = JSON.stringify(outcome);
  const receiptSuffix = appendJsonLine(receiptsBefore.bytes, receiptLine);
  const outcomeSuffix = appendJsonLine(outcomesBefore.bytes, outcomeLine);
  const candidateReport = validateCandidate({
    rootDir: realRoot,
    receiptsBytes: Buffer.concat([receiptsBefore.bytes, receiptSuffix]),
    outcomesBytes: Buffer.concat([outcomesBefore.bytes, outcomeSuffix]),
    evaluatedAt, revision,
  });
  assertCandidateSafety({ base: baseReport, candidate: candidateReport, outcome, outcomeLine, previous });
  if (resolveRevision(realRoot) !== revision) throw new Error('candidate replay 期间 source-state v2 revision 发生漂移');
  const receiptsAfter = readEvolutionOutcomeLedgerSnapshot(realRoot, receiptsPath);
  const outcomesAfter = readEvolutionOutcomeLedgerSnapshot(realRoot, outcomesPath);
  assertDistinctSnapshots(receiptsAfter, outcomesAfter);
  assertSnapshotUnchanged(receiptsBefore, receiptsAfter, 'receipt ledger');
  assertSnapshotUnchanged(outcomesBefore, outcomesAfter, 'outcome ledger');
  return {
    report: {
      schemaVersion: 1, reportType: 'ai-evolution-unverified-trace-outcome-writer',
      writerVersion: AI_EVOLUTION_UNVERIFIED_TRACE_OUTCOME_WRITER_VERSION,
      ok: true, mode: 'preview', status: 'ready', evidenceStatus: 'trace-bound-unverified',
      caseId: caseItem.id, corpusVersion: corpus.corpus.corpusVersion, revision,
      traceSha256: hashEvolutionTraceValue(trace), candidate: { receiptId, outcomeId, sequence },
      counts: { candidates: 1, alreadyCurrent: 0, confirmedDelta: 0 },
      confirmedCoverageEligible: false, ledgerMutationRequested: false, ledgerMutationPerformed: false,
    },
    transaction: {
      revision, receiptsPath, outcomesPath,
      receiptsBase: receiptsBefore.bytes, outcomesBase: outcomesBefore.bytes,
      receiptSuffix, outcomeSuffix, baseReport, outcome, outcomeLine, previous,
    },
  };
};

const enabledFlag = value => value !== undefined && value !== null
  && !['', '0', 'false', 'no', 'off'].includes(String(value).trim().toLowerCase());

const buildPostcheck = ({ rootDir, evaluatedAt, resolveRevision, transaction }) => () => {
  try {
    if (resolveRevision(rootDir) !== transaction.revision) throw new Error('ledger commit 后 source-state v2 revision 发生漂移');
    const report = buildAiGovernanceEvolutionEvalReport({
      rootDir,
      maxDate: evaluatedAt,
      resolveRevision,
    });
    assertCandidateSafety({
      base: transaction.baseReport, candidate: report,
      outcome: transaction.outcome, outcomeLine: transaction.outcomeLine, previous: transaction.previous,
    });
    return { ok: true, failures: [] };
  } catch (error) {
    return { ok: false, failures: [error instanceof Error ? error.message : String(error)] };
  }
};

export const recordEvolutionUnverifiedTraceOutcome = ({
  rootDir,
  observation,
  write = false,
  evaluatedAt = getLocalIsoDate(),
  env = process.env,
  resolveRevision = resolveEvolutionWorktreeRevision,
  validateCandidate = validateEvolutionDeterministicOutcomeCandidate,
  transactionApi = {
    acquire: acquireEvolutionOutcomeWriterLock,
    recover: recoverEvolutionOutcomeTransaction,
    commit: commitEvolutionOutcomeTransaction,
  },
} = {}) => {
  if (typeof write !== 'boolean') throw new TypeError('write 必须是布尔值');
  if (!write) return prepareEvolutionUnverifiedTraceOutcome({
    rootDir, observation, evaluatedAt, resolveRevision, validateCandidate,
  }).report;
  if (enabledFlag(env.CI) || enabledFlag(env.GITHUB_ACTIONS)) {
    throw new Error('CI/GitHub Actions 中禁止 unverified trace outcome --write');
  }
  const realRoot = fs.realpathSync(rootDir);
  const lock = transactionApi.acquire({ rootDir: realRoot });
  try {
    const recovery = transactionApi.recover({
      rootDir: realRoot, controlPaths: lock,
      receiptsPath: path.join(realRoot, RECEIPTS_RELATIVE_PATH),
      outcomesPath: path.join(realRoot, OUTCOMES_RELATIVE_PATH), resolveRevision,
    });
    const prepared = prepareEvolutionUnverifiedTraceOutcome({
      rootDir: realRoot, observation, evaluatedAt, resolveRevision, validateCandidate,
    });
    if (prepared.report.counts.candidates === 0) return {
      ...prepared.report, mode: 'write', status: 'already-current', recovery,
      ledgerMutationRequested: true, ledgerMutationPerformed: false,
    };
    const transaction = prepared.transaction;
    const result = transactionApi.commit({
      rootDir: realRoot, controlPaths: lock, revision: transaction.revision,
      receiptsPath: transaction.receiptsPath, outcomesPath: transaction.outcomesPath,
      receiptsBase: transaction.receiptsBase, outcomesBase: transaction.outcomesBase,
      receiptSuffix: transaction.receiptSuffix, outcomeSuffix: transaction.outcomeSuffix,
      resolveRevision,
      postcheck: buildPostcheck({ rootDir: realRoot, evaluatedAt, resolveRevision, transaction }),
    });
    return {
      ...prepared.report, mode: 'write', status: result.status, recovery, transaction: result,
      ledgerMutationRequested: true, ledgerMutationPerformed: true,
    };
  } finally {
    lock.release();
  }
};
