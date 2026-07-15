import { createHash } from 'node:crypto';
import fs from 'node:fs';

import { getLocalIsoDate } from './aiGovernanceDateBounds.mjs';
import {
  collectEvolutionIsoDateFailures,
  collectEvolutionSensitiveFieldFailures,
  isEvolutionCorpusVersion,
  isEvolutionPositiveInteger,
  isEvolutionRecord,
  isEvolutionString,
  isEvolutionSubjectVersion,
} from './aiGovernanceEvolutionEvalContract.mjs';
import {
  AI_EVOLUTION_EXECUTABLE_CASES,
  getAiGovernanceEvolutionCaseCommands,
} from './aiGovernanceEvolutionCaseRunner.mjs';
import { verifyEvolutionTraceReceipt } from './aiGovernanceEvolutionTrace.mjs';
import { verifyEvolutionTraceProof } from './aiGovernanceEvolutionTraceProof.mjs';

const RECEIPT_ID_PATTERN = /^[a-z][a-z0-9-]*$/;
const REVISION_PATTERN = /^(?:[0-9a-f]{40}|(?:worktree|commit|ci)-[0-9a-f]{40}|worktree-[0-9a-f]{64})$/;
const METHODS = new Set(['deterministic', 'model', 'human', 'hybrid']);
const SOURCES = new Set(['local', 'ci', 'mcp', 'manual']);
const VERDICTS = new Set(['pass', 'partial', 'fail']);
const GRADE_TARGETS = new Set(['trace', 'outcome', 'both']);
const VALIDATION_STATUSES = new Set(['passed', 'failed']);
const RECEIPT_FIELDS = [
  'schemaVersion', 'id', 'artifactType', 'dataClass', 'caseId', 'corpusVersion', 'caseVersion',
  'subjectVersion', 'evaluatedAt', 'method', 'source', 'runner', 'revision', 'aggregation',
  'trialResults', 'validations',
];
const RECEIPT_V1_FIELDS = new Set(RECEIPT_FIELDS);
const RECEIPT_V2_FIELDS = new Set([...RECEIPT_FIELDS, 'trace']);
const RECEIPT_V3_FIELDS = new Set([...RECEIPT_FIELDS, 'trace', 'proof']);
const TRIAL_FIELDS = new Set(['trial', 'verdict', 'score', 'gradeTarget', 'evidence']);
const VALIDATION_FIELDS = new Set(['command', 'status', 'evidence', 'checkedAt']);
const MAX_LINE_BYTES = 64 * 1024;

const unexpectedFields = (value, allowed, label) => Object.keys(value)
  .filter(field => !allowed.has(field))
  .map(field => `${label}.${field} 不在允许字段中`);
const isBoundedString = (value, max = 1000) => isEvolutionString(value) && value.length <= max;

export const hashEvolutionTrialReceiptLine = line => createHash('sha256').update(line, 'utf8').digest('hex');

export const aggregateEvolutionTrialResults = (trialResults) => {
  const verdicts = trialResults.map(item => item.verdict);
  const verdict = verdicts.every(item => item === 'pass')
    ? 'pass'
    : verdicts.every(item => item === 'fail') ? 'fail' : 'partial';
  const score = Math.round(trialResults.reduce((sum, item) => sum + item.score, 0) / trialResults.length);
  return { verdict, score };
};

const collectTrialFailures = (trial, index, label) => {
  const trialLabel = `${label}.trialResults[${index}]`;
  if (!isEvolutionRecord(trial)) return [`${trialLabel} 必须是对象`];
  const failures = unexpectedFields(trial, TRIAL_FIELDS, trialLabel);
  if (!isEvolutionPositiveInteger(trial.trial)) failures.push(`${trialLabel}.trial 必须是正整数`);
  if (!VERDICTS.has(trial.verdict)) failures.push(`${trialLabel}.verdict 枚举值非法`);
  if (!Number.isFinite(trial.score) || trial.score < 0 || trial.score > 100) {
    failures.push(`${trialLabel}.score 必须是 0 到 100 的数值`);
  }
  if (!GRADE_TARGETS.has(trial.gradeTarget)) failures.push(`${trialLabel}.gradeTarget 枚举值非法`);
  if (!isBoundedString(trial.evidence)) failures.push(`${trialLabel}.evidence 必须是 1 到 1000 字符`);
  if (trial.verdict === 'pass' && trial.score < 60) failures.push(`${trialLabel} pass score 不能低于 60`);
  return failures;
};

const collectValidationFailures = (validation, index, label, maxDate, evaluatedAt) => {
  const validationLabel = `${label}.validations[${index}]`;
  if (!isEvolutionRecord(validation)) return [`${validationLabel} 必须是对象`];
  const failures = unexpectedFields(validation, VALIDATION_FIELDS, validationLabel);
  if (!isBoundedString(validation.command, 500)) failures.push(`${validationLabel}.command 必须是 1 到 500 字符`);
  if (!VALIDATION_STATUSES.has(validation.status)) failures.push(`${validationLabel}.status 枚举值非法`);
  if (!isBoundedString(validation.evidence)) failures.push(`${validationLabel}.evidence 必须是 1 到 1000 字符`);
  failures.push(...collectEvolutionIsoDateFailures(`${validationLabel}.checkedAt`, validation.checkedAt, maxDate));
  if (validation.checkedAt !== evaluatedAt) failures.push(`${validationLabel}.checkedAt 必须等于 receipt evaluatedAt`);
  return failures;
};

const collectDeterministicFailures = (receipt, label, rootDir) => {
  if (receipt.method !== 'deterministic' || [2, 3].includes(receipt.schemaVersion)) return [];
  const descriptor = AI_EVOLUTION_EXECUTABLE_CASES[receipt.caseId];
  const failures = [];
  if (descriptor?.evidenceScope !== 'deterministic-case') {
    failures.push(`${label} deterministic receipt 只能引用 deterministic-case`);
  }
  if (receipt.runner !== 'ai-evolution-case-runner') {
    failures.push(`${label}.runner 必须为 ai-evolution-case-runner`);
  }
  if (receipt.trialResults?.length !== 1) failures.push(`${label} deterministic receipt 必须精确记录 1 次 trial`);
  if (receipt.trialResults?.some(trial => trial?.gradeTarget !== 'outcome')) {
    failures.push(`${label} 在真实 trace verifier 建成前 gradeTarget 只能为 outcome`);
  }
  if (descriptor && receipt.caseVersion === descriptor.caseVersion
    && receipt.subjectVersion === descriptor.subjectVersion) {
    const expected = getAiGovernanceEvolutionCaseCommands({ rootDir, caseId: receipt.caseId });
    const actual = receipt.validations?.map(item => item?.command) ?? [];
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
      failures.push(`${label}.validations 必须按固定 runner 的精确命令顺序声明`);
    }
  }
  return failures;
};

const collectReceiptFailures = (receipt, index, rootDir, maxDate, trustedSigners) => {
  const label = `trial-receipts.jsonl: 第 ${index + 1} 条 receipt`;
  if (!isEvolutionRecord(receipt)) {
    return { failures: [`${label} 必须是对象`], traceVerification: undefined, proofVerification: undefined };
  }
  const allowedFields = receipt.schemaVersion === 3
    ? RECEIPT_V3_FIELDS : receipt.schemaVersion === 2 ? RECEIPT_V2_FIELDS : RECEIPT_V1_FIELDS;
  const failures = unexpectedFields(receipt, allowedFields, label);
  if (![1, 2, 3].includes(receipt.schemaVersion)) failures.push(`${label}.schemaVersion 必须为 1、2 或 3`);
  if (!RECEIPT_ID_PATTERN.test(receipt.id ?? '')) failures.push(`${label}.id 必须是稳定的 kebab-case`);
  if (receipt.artifactType !== 'ai-evolution-trial-receipt') failures.push(`${label}.artifactType 非法`);
  if (receipt.dataClass !== 'redacted') failures.push(`${label}.dataClass 必须为 redacted`);
  if (!isEvolutionString(receipt.caseId)) failures.push(`${label}.caseId 不能为空`);
  if (!isEvolutionCorpusVersion(receipt.corpusVersion)) failures.push(`${label}.corpusVersion 必须是 x.y.z`);
  if (!isEvolutionPositiveInteger(receipt.caseVersion)) failures.push(`${label}.caseVersion 必须是正整数`);
  if (!isEvolutionSubjectVersion(receipt.subjectVersion)) failures.push(`${label}.subjectVersion 非法`);
  failures.push(...collectEvolutionIsoDateFailures(`${label}.evaluatedAt`, receipt.evaluatedAt, maxDate));
  if (!METHODS.has(receipt.method)) failures.push(`${label}.method 枚举值非法`);
  if (!SOURCES.has(receipt.source)) failures.push(`${label}.source 枚举值非法`);
  if (!isBoundedString(receipt.runner, 100)) failures.push(`${label}.runner 必须是 1 到 100 字符`);
  if (!REVISION_PATTERN.test(receipt.revision ?? '')) failures.push(`${label}.revision 必须绑定完整 Git 或 worktree revision`);
  if (receipt.aggregation !== 'all-pass') failures.push(`${label}.aggregation 当前只允许 all-pass`);
  const trials = Array.isArray(receipt.trialResults) ? receipt.trialResults : [];
  if (trials.length === 0 || trials.length > 10) failures.push(`${label}.trialResults 数量必须在 1 到 10 之间`);
  trials.forEach((trial, trialIndex) => failures.push(...collectTrialFailures(trial, trialIndex, label)));
  if (trials.some((trial, trialIndex) => trial?.trial !== trialIndex + 1)) {
    failures.push(`${label}.trialResults trial 必须从 1 连续递增`);
  }
  const validations = Array.isArray(receipt.validations) ? receipt.validations : [];
  if (validations.length === 0 || validations.length > 20) failures.push(`${label}.validations 数量必须在 1 到 20 之间`);
  validations.forEach((item, itemIndex) => failures.push(
    ...collectValidationFailures(item, itemIndex, label, maxDate, receipt.evaluatedAt)
  ));
  if (trials.length > 0 && aggregateEvolutionTrialResults(trials).verdict === 'pass'
    && validations.some(item => item?.status !== 'passed')) {
    failures.push(`${label} 聚合 verdict 为 pass 时所有 validations 必须 passed`);
  }
  let traceVerification;
  let proofVerification;
  if ([2, 3].includes(receipt.schemaVersion)) {
    if (trials.length !== 1) failures.push(`${label} v${receipt.schemaVersion} 必须精确记录 1 次 trial`);
    if (trials.some(trial => !['trace', 'both'].includes(trial?.gradeTarget))) {
      failures.push(`${label} v${receipt.schemaVersion} trial gradeTarget 只允许 trace 或 both`);
    }
    traceVerification = verifyEvolutionTraceReceipt(receipt);
    failures.push(...traceVerification.failures.map(failure => `${label}.${failure}`));
    if (receipt.schemaVersion === 3) {
      proofVerification = verifyEvolutionTraceProof(receipt, { trustedSigners });
      if (proofVerification.status === 'rejected') {
        failures.push(...proofVerification.failures.map(failure => `${label}.proof: ${failure}`));
      }
    }
  }
  failures.push(...collectDeterministicFailures(receipt, label, rootDir));
  failures.push(...collectEvolutionSensitiveFieldFailures(receipt, label));
  return { failures, traceVerification, proofVerification };
};

export const readEvolutionTrialReceiptLedger = (
  filePath,
  { rootDir, maxDate = getLocalIsoDate(), trustedSigners = new Map() } = {}
) => {
  let text;
  try {
    text = fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    return { receipts: [], validReceipts: [], receiptsById: new Map(), failures: [`trial-receipts.jsonl: 无法读取（${error.message}）`], invalidReceiptCount: 0 };
  }
  const parsed = [];
  const failures = [];
  text.split(/\r?\n/).forEach((line, lineIndex) => {
    if (!line.trim()) return;
    if (Buffer.byteLength(line, 'utf8') > MAX_LINE_BYTES) failures.push(`trial-receipts.jsonl: 第 ${lineIndex + 1} 行超过 64 KiB`);
    try {
      const receipt = JSON.parse(line);
      const { failures: itemFailures, traceVerification, proofVerification } = collectReceiptFailures(
        receipt, lineIndex, rootDir, maxDate, trustedSigners
      );
      if (line !== JSON.stringify(receipt)) itemFailures.push(`trial-receipts.jsonl: 第 ${lineIndex + 1} 行必须使用精确紧凑 JSON`);
      parsed.push({
        receipt, line, sha256: hashEvolutionTrialReceiptLine(line), failures: itemFailures,
        traceVerification, proofVerification,
      });
      failures.push(...itemFailures);
    } catch {
      failures.push(`trial-receipts.jsonl: 第 ${lineIndex + 1} 行不是合法 JSON`);
    }
  });
  const idCounts = new Map();
  parsed.forEach(({ receipt }) => idCounts.set(receipt.id, (idCounts.get(receipt.id) ?? 0) + 1));
  if ([...idCounts.values()].some(count => count > 1)) failures.push('trial-receipts.jsonl: receipt id 必须唯一');
  const validEntries = parsed.filter(item => item.failures.length === 0 && idCounts.get(item.receipt.id) === 1);
  const receiptsById = new Map(validEntries.map(item => [item.receipt.id, item]));
  return {
    receipts: parsed.map(item => item.receipt),
    validReceipts: validEntries.map(item => item.receipt),
    receiptsById,
    failures,
    invalidReceiptCount: parsed.length - validEntries.length,
  };
};
