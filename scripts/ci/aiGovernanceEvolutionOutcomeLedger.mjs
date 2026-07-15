import fs from 'node:fs';
import path from 'node:path';

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
import { collectEvolutionEvidenceEligibilityFailures, collectEvolutionReceiptBindingFailures, compareEvolutionVersions, isEvolutionV2Revision, isSafeExistingEvolutionFile } from './aiGovernanceEvolutionOutcomeEvidence.mjs';
import { buildEvolutionOutcomeChainReport } from './aiGovernanceEvolutionOutcomeChain.mjs';

const OUTCOME_ID_PATTERN = /^[a-z][a-z0-9-]*$/;
const VERDICTS = new Set(['pass', 'partial', 'fail']);
const PROVENANCE_METHODS = new Set(['deterministic', 'model', 'human', 'hybrid']);
const PROVENANCE_SOURCES = new Set(['local', 'ci', 'mcp', 'manual']);
const VALIDATION_STATUSES = new Set(['passed', 'failed']);
const OUTCOME_SCHEMA_VERSIONS = new Set([1, 2, 3]);
const OUTCOME_FIELDS = new Set(['schemaVersion', 'id', 'caseId', 'corpusVersion', 'caseVersion', 'subjectVersion', 'evaluatedAt', 'verdict', 'score', 'feedback', 'provenance', 'evidence', 'writeback']);
const OUTCOME_V3_FIELDS = new Set([...OUTCOME_FIELDS, 'chain', 'supersession']);
const PROVENANCE_FIELDS = new Set(['method', 'source', 'runner', 'revision', 'trials']);
const WRITEBACK_FIELDS = new Set(['files', 'validationResults']);
const VALIDATION_FIELDS = new Set(['command', 'status', 'evidence', 'checkedAt']);

const collectUnexpectedFieldFailures = (value, allowedFields, label) => (
  Object.keys(value).filter(field => !allowedFields.has(field)).map(field => `${label}.${field} 不在允许字段中`)
);

const collectValidationResultFailures = (result, label, maxDate) => {
  if (!isEvolutionRecord(result)) return [`${label} 必须是对象`];
  const failures = collectUnexpectedFieldFailures(result, VALIDATION_FIELDS, label);
  if (!isEvolutionString(result.command)) failures.push(`${label}.command 不能为空`);
  if (!VALIDATION_STATUSES.has(result.status)) failures.push(`${label}.status 枚举值非法`);
  if (!isEvolutionString(result.evidence)) failures.push(`${label}.evidence 不能为空`);
  failures.push(...collectEvolutionIsoDateFailures(`${label}.checkedAt`, result.checkedAt, maxDate));
  return failures;
};

const collectWritebackFailures = (outcome, label, maxDate, rootDir) => {
  if (outcome.writeback === undefined) return [`${label}.writeback 必须提供实际 validationResults`];
  if (!isEvolutionRecord(outcome.writeback)) return [`${label}.writeback 必须是对象`];
  const { files, validationResults } = outcome.writeback;
  const failures = collectUnexpectedFieldFailures(outcome.writeback, WRITEBACK_FIELDS, `${label}.writeback`);
  if (!Array.isArray(files) || !files.every(isEvolutionString)) {
    failures.push(`${label}.writeback.files 必须是字符串数组`);
  } else if (new Set(files).size !== files.length) {
    failures.push(`${label}.writeback.files 不能包含重复项`);
  } else if (outcome.schemaVersion >= 2 && files.some(file => !isSafeExistingEvolutionFile(rootDir, file))) {
    failures.push(`${label}.writeback.files 必须是仓库内真实存在的安全相对文件路径`);
  }
  if (!Array.isArray(validationResults)) {
    failures.push(`${label}.writeback.validationResults 必须是数组`);
    return failures;
  }
  if (validationResults.length === 0) failures.push(`${label}.writeback 必须包含实际 validationResults（至少一条）`);
  validationResults.forEach((result, index) => failures.push(
    ...collectValidationResultFailures(result, `${label}.writeback.validationResults[${index}]`, maxDate)
  ));
  if (outcome.verdict === 'pass' && validationResults.some(result => result?.status !== 'passed')) {
    failures.push(`${label} verdict 为 pass 时所有 validationResults 必须 passed`);
  }
  return failures;
};

const collectOutcomeFailures = (outcome, index, { caseIds, maxDate, rootDir, receiptsById, currentCorpusVersion }) => {
  const label = `outcomes.jsonl: 第 ${index + 1} 条 outcome`;
  if (!isEvolutionRecord(outcome)) return [`${label} 必须是对象`];
  const allowedFields = outcome.schemaVersion === 3 ? OUTCOME_V3_FIELDS : OUTCOME_FIELDS;
  const failures = collectUnexpectedFieldFailures(outcome, allowedFields, label);
  if (!OUTCOME_SCHEMA_VERSIONS.has(outcome.schemaVersion)) failures.push(`${label}.schemaVersion 必须为 1、2 或 3`);
  if (!OUTCOME_ID_PATTERN.test(outcome.id ?? '')) failures.push(`${label}.id 必须是稳定的 kebab-case`);
  if (!isEvolutionString(outcome.caseId)) failures.push(`${label}.caseId 不能为空`);
  else if (!caseIds.has(outcome.caseId)) failures.push(`${label}.caseId 引用了未知 case \`${outcome.caseId}\``);
  if (!isEvolutionCorpusVersion(outcome.corpusVersion)) failures.push(`${label}.corpusVersion 必须是 x.y.z`);
  else if (isEvolutionCorpusVersion(currentCorpusVersion) && compareEvolutionVersions(outcome.corpusVersion, currentCorpusVersion) > 0) {
    failures.push(`${label}.corpusVersion 不能高于当前 corpus`);
  }
  if (!isEvolutionPositiveInteger(outcome.caseVersion)) failures.push(`${label}.caseVersion 必须是正整数`);
  if (!isEvolutionSubjectVersion(outcome.subjectVersion)) failures.push(`${label}.subjectVersion 必须是安全的稳定版本标识`);
  failures.push(...collectEvolutionIsoDateFailures(`${label}.evaluatedAt`, outcome.evaluatedAt, maxDate));
  if (!VERDICTS.has(outcome.verdict)) failures.push(`${label}.verdict 枚举值非法`);
  if (!Number.isFinite(outcome.score) || outcome.score < 0 || outcome.score > 100) {
    failures.push(`${label}.score 必须是 0 到 100 的数值`);
  }
  if (outcome.verdict === 'pass' && outcome.score < 60) failures.push(`${label} verdict 为 pass 时 score 不能低于 60`);
  if (['fail', 'partial'].includes(outcome.verdict) && !isEvolutionString(outcome.feedback)) {
    failures.push(`${label} verdict 为 ${outcome.verdict} 时必须提供 feedback`);
  }
  if (!isEvolutionRecord(outcome.provenance)) failures.push(`${label}.provenance 必须是对象`);
  else {
    failures.push(...collectUnexpectedFieldFailures(outcome.provenance, PROVENANCE_FIELDS, `${label}.provenance`));
    if (!PROVENANCE_METHODS.has(outcome.provenance.method)) failures.push(`${label}.provenance.method 枚举值非法`);
    if (!PROVENANCE_SOURCES.has(outcome.provenance.source)) failures.push(`${label}.provenance.source 枚举值非法`);
    if (!isEvolutionString(outcome.provenance.runner)) failures.push(`${label}.provenance.runner 不能为空`);
    if (!isEvolutionString(outcome.provenance.revision)) failures.push(`${label}.provenance.revision 不能为空`);
    if (outcome.schemaVersion >= 2 && !isEvolutionV2Revision(outcome.provenance.revision)) {
      failures.push(`${label}.provenance.revision 必须绑定完整 Git 或 worktree revision`);
    }
    if (!isEvolutionPositiveInteger(outcome.provenance.trials)) failures.push(`${label}.provenance.trials 必须是正整数`);
  }
  failures.push(...collectWritebackFailures(outcome, label, maxDate, rootDir));
  failures.push(...collectEvolutionEvidenceEligibilityFailures(outcome, label, receiptsById));
  failures.push(...collectEvolutionReceiptBindingFailures(outcome, label, receiptsById));
  failures.push(...collectEvolutionSensitiveFieldFailures(outcome, label));
  return failures;
};

const parseOutcomeLines = (text) => {
  const outcomes = [];
  const entries = [];
  const failures = [];
  let ordinal = 0;
  text.split(/\r?\n/).forEach((line, lineIndex) => {
    if (!line.trim()) return;
    ordinal += 1;
    try {
      const outcome = JSON.parse(line);
      outcomes.push(outcome);
      entries.push({ outcome, line, ordinal });
    } catch {
      entries.push({ outcome: null, line, ordinal });
      failures.push(`outcomes.jsonl: 第 ${lineIndex + 1} 行不是合法 JSON`);
    }
  });
  return { outcomes, entries, failures };
};

export const readEvolutionOutcomeLedger = (
  filePath,
  {
    caseIds = new Set(),
    maxDate = getLocalIsoDate(),
    rootDir = path.resolve(path.dirname(filePath), '../..'),
    receiptsById = new Map(),
    currentCorpusVersion,
  } = {}
) => {
  let parsed;
  try {
    parsed = parseOutcomeLines(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    return {
      outcomes: [], validOutcomes: [], failures: [`outcomes.jsonl: 无法读取（${error.message}）`],
      invalidOutcomeCount: 0, ledgerChain: buildEvolutionOutcomeChainReport([]).summary,
    };
  }

  const chainReport = buildEvolutionOutcomeChainReport(parsed.entries);
  const failures = [...parsed.failures, ...chainReport.failures];
  const validOutcomes = [];
  let latestEvaluatedAt = '';
  parsed.outcomes.forEach((outcome, index) => {
    const itemFailures = collectOutcomeFailures(outcome, index, {
      caseIds, maxDate, rootDir, receiptsById, currentCorpusVersion,
    });
    if (typeof outcome?.evaluatedAt === 'string' && latestEvaluatedAt && outcome.evaluatedAt < latestEvaluatedAt) {
      itemFailures.push(`outcomes.jsonl: 第 ${index + 1} 条 outcome.evaluatedAt 不能早于前序记录`);
    }
    if (typeof outcome?.evaluatedAt === 'string' && outcome.evaluatedAt > latestEvaluatedAt) latestEvaluatedAt = outcome.evaluatedAt;
    failures.push(...itemFailures);
    if (itemFailures.length === 0) validOutcomes.push(outcome);
  });
  const ids = parsed.outcomes.map(item => item?.id).filter(Boolean);
  const idCounts = new Map();
  ids.forEach(id => idCounts.set(id, (idCounts.get(id) ?? 0) + 1));
  if ([...idCounts.values()].some(count => count > 1)) failures.push('outcomes.jsonl: outcome id 必须唯一');
  const uniquelyValidOutcomes = validOutcomes.filter(outcome => idCounts.get(outcome.id) === 1);
  return {
    outcomes: parsed.outcomes,
    validOutcomes: uniquelyValidOutcomes,
    failures,
    invalidOutcomeCount: parsed.outcomes.length - uniquelyValidOutcomes.length,
    ledgerChain: chainReport.summary,
  };
};
