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
  collectEvolutionEvidenceEligibilityFailures,
  collectEvolutionReceiptBindingFailures,
  compareEvolutionVersions,
  isEvolutionV2Revision,
  isSafeExistingEvolutionFile,
} from './aiGovernanceEvolutionOutcomeEvidence.mjs';

const OUTCOME_ID_PATTERN = /^[a-z][a-z0-9-]*$/;
const VERDICTS = new Set(['pass', 'partial', 'fail']);
const PROVENANCE_METHODS = new Set(['deterministic', 'model', 'human', 'hybrid']);
const PROVENANCE_SOURCES = new Set(['local', 'ci', 'mcp', 'manual']);
const VALIDATION_STATUSES = new Set(['passed', 'failed']);
const OUTCOME_SCHEMA_VERSIONS = new Set([1, 2, 3]);
const OUTCOME_FIELDS = new Set([
  'schemaVersion', 'id', 'caseId', 'corpusVersion', 'caseVersion', 'subjectVersion',
  'evaluatedAt', 'verdict', 'score', 'feedback', 'provenance', 'evidence', 'writeback',
]);
const OUTCOME_V3_FIELDS = new Set([...OUTCOME_FIELDS, 'chain', 'supersession']);
const PROVENANCE_FIELDS = new Set(['method', 'source', 'runner', 'revision', 'trials']);
const EVIDENCE_FIELDS = new Set(['receiptId', 'sha256']);
const WRITEBACK_FIELDS = new Set(['files', 'validationResults']);
const VALIDATION_FIELDS = new Set(['command', 'status', 'evidence', 'checkedAt']);
const MAX_FEEDBACK_LENGTH = 1000;
const MAX_RUNNER_LENGTH = 100;
const MAX_TRIALS = 10;
const MAX_WRITEBACK_FILES = 100;
const MAX_WRITEBACK_FILE_LENGTH = 500;
const MAX_VALIDATION_RESULTS = 20;
const MAX_VALIDATION_COMMAND_LENGTH = 500;
const MAX_VALIDATION_EVIDENCE_LENGTH = 1000;

const isBoundedString = (value, maxLength) => isEvolutionString(value) && value.length <= maxLength;

const collectClosedShapeFailures = (value, allowedFields, label) => (
  Object.keys(value).some(field => !allowedFields.has(field)) ? [`${label} 必须是闭字段对象`] : []
);

const collectValidationResultFailures = (result, label, maxDate) => {
  if (!isEvolutionRecord(result)) return [`${label} 必须是对象`];
  const failures = collectClosedShapeFailures(result, VALIDATION_FIELDS, label);
  if (!isBoundedString(result.command, MAX_VALIDATION_COMMAND_LENGTH)) {
    failures.push(`${label}.command 必须是 1 到 500 字符`);
  }
  if (!VALIDATION_STATUSES.has(result.status)) failures.push(`${label}.status 枚举值非法`);
  if (!isBoundedString(result.evidence, MAX_VALIDATION_EVIDENCE_LENGTH)) {
    failures.push(`${label}.evidence 必须是 1 到 1000 字符`);
  }
  failures.push(...collectEvolutionIsoDateFailures(`${label}.checkedAt`, result.checkedAt, maxDate));
  return failures;
};

const collectWritebackFailures = (outcome, label, maxDate, rootDir) => {
  if (outcome.writeback === undefined) return [`${label}.writeback 必须提供实际 validationResults`];
  if (!isEvolutionRecord(outcome.writeback)) return [`${label}.writeback 必须是对象`];
  const { files, validationResults } = outcome.writeback;
  const failures = collectClosedShapeFailures(outcome.writeback, WRITEBACK_FIELDS, `${label}.writeback`);
  if (!Array.isArray(files)) {
    failures.push(`${label}.writeback.files 必须是字符串数组`);
  } else if (files.length > MAX_WRITEBACK_FILES) {
    failures.push(`${label}.writeback.files 数量不能超过 100`);
  } else if (!files.every(file => isBoundedString(file, MAX_WRITEBACK_FILE_LENGTH))) {
    failures.push(`${label}.writeback.files 每项必须是 1 到 500 字符`);
  } else if (new Set(files).size !== files.length) {
    failures.push(`${label}.writeback.files 不能包含重复项`);
  } else if (outcome.schemaVersion >= 2 && files.some(file => !isSafeExistingEvolutionFile(rootDir, file))) {
    failures.push(`${label}.writeback.files 必须是仓库内真实存在的安全相对文件路径`);
  }
  if (!Array.isArray(validationResults)) {
    failures.push(`${label}.writeback.validationResults 必须是数组`);
    return failures;
  }
  if (validationResults.length === 0) {
    failures.push(`${label}.writeback 必须包含实际 validationResults（至少一条）`);
  } else if (validationResults.length > MAX_VALIDATION_RESULTS) {
    failures.push(`${label}.writeback.validationResults 数量不能超过 20`);
  }
  validationResults.slice(0, MAX_VALIDATION_RESULTS).forEach((result, index) => failures.push(
    ...collectValidationResultFailures(result, `${label}.writeback.validationResults[${index}]`, maxDate),
  ));
  if (outcome.verdict === 'pass' && validationResults.length <= MAX_VALIDATION_RESULTS
    && validationResults.some(result => result?.status !== 'passed')) {
    failures.push(`${label} verdict 为 pass 时所有 validationResults 必须 passed`);
  }
  return failures;
};

const collectNonReflectiveSensitiveFailures = (outcome, label) => {
  const failures = collectEvolutionSensitiveFieldFailures(outcome, label);
  const normalized = failures.map(failure => (
    failure.includes('隐私扫描结构超过')
      ? `${label}: 隐私扫描结构超过 64 层或 10000 节点`
      : failure.includes('禁止敏感字段名')
      ? `${label}: 禁止敏感字段名`
      : `${label}: 禁止疑似凭据值`
  ));
  return [...new Set(normalized)];
};

const collectEvidenceFailures = (outcome, label, receiptsById) => {
  const failures = [];
  let evidence = outcome.evidence;
  if (isEvolutionRecord(evidence)) {
    failures.push(...collectClosedShapeFailures(evidence, EVIDENCE_FIELDS, `${label}.evidence`));
    evidence = { receiptId: evidence.receiptId, sha256: evidence.sha256 };
  }
  const sanitizedOutcome = { ...outcome, evidence };
  failures.push(...collectEvolutionEvidenceEligibilityFailures(sanitizedOutcome, label, receiptsById));
  failures.push(...collectEvolutionReceiptBindingFailures(sanitizedOutcome, label, receiptsById));
  return failures;
};

export const collectEvolutionOutcomeFailures = (
  outcome,
  ordinal,
  {
    caseIds = new Set(),
    maxDate,
    rootDir,
    receiptsById = new Map(),
    currentCorpusVersion,
  } = {},
) => {
  const label = `outcomes.jsonl: 第 ${ordinal} 条 outcome`;
  if (!isEvolutionRecord(outcome)) return [`${label} 必须是对象`];
  const allowedFields = outcome.schemaVersion === 3 ? OUTCOME_V3_FIELDS : OUTCOME_FIELDS;
  const failures = collectClosedShapeFailures(outcome, allowedFields, label);
  if (!OUTCOME_SCHEMA_VERSIONS.has(outcome.schemaVersion)) failures.push(`${label}.schemaVersion 必须为 1、2 或 3`);
  if (typeof outcome.id !== 'string' || !OUTCOME_ID_PATTERN.test(outcome.id)) {
    failures.push(`${label}.id 必须是稳定的 kebab-case`);
  }
  if (!isEvolutionString(outcome.caseId)) failures.push(`${label}.caseId 不能为空`);
  else if (!caseIds.has(outcome.caseId)) failures.push(`${label}.caseId 引用了未知 case`);
  if (!isEvolutionCorpusVersion(outcome.corpusVersion)) failures.push(`${label}.corpusVersion 必须是 x.y.z`);
  else if (isEvolutionCorpusVersion(currentCorpusVersion)
    && compareEvolutionVersions(outcome.corpusVersion, currentCorpusVersion) > 0) {
    failures.push(`${label}.corpusVersion 不能高于当前 corpus`);
  }
  if (!isEvolutionPositiveInteger(outcome.caseVersion)) failures.push(`${label}.caseVersion 必须是正整数`);
  if (!isEvolutionSubjectVersion(outcome.subjectVersion)) {
    failures.push(`${label}.subjectVersion 必须是安全的稳定版本标识`);
  }
  failures.push(...collectEvolutionIsoDateFailures(`${label}.evaluatedAt`, outcome.evaluatedAt, maxDate));
  if (!VERDICTS.has(outcome.verdict)) failures.push(`${label}.verdict 枚举值非法`);
  if (!Number.isFinite(outcome.score) || outcome.score < 0 || outcome.score > 100) {
    failures.push(`${label}.score 必须是 0 到 100 的数值`);
  }
  if (outcome.verdict === 'pass' && outcome.score < 60) failures.push(`${label} verdict 为 pass 时 score 不能低于 60`);
  const hasValidFeedback = isBoundedString(outcome.feedback, MAX_FEEDBACK_LENGTH);
  if (outcome.feedback !== undefined && !hasValidFeedback) {
    failures.push(`${label}.feedback 必须是 1 到 1000 字符`);
  } else if (['fail', 'partial'].includes(outcome.verdict) && !hasValidFeedback) {
    failures.push(`${label} verdict 为 ${outcome.verdict} 时必须提供 feedback（1 到 1000 字符）`);
  }
  if (!isEvolutionRecord(outcome.provenance)) failures.push(`${label}.provenance 必须是对象`);
  else {
    failures.push(...collectClosedShapeFailures(outcome.provenance, PROVENANCE_FIELDS, `${label}.provenance`));
    if (!PROVENANCE_METHODS.has(outcome.provenance.method)) failures.push(`${label}.provenance.method 枚举值非法`);
    if (!PROVENANCE_SOURCES.has(outcome.provenance.source)) failures.push(`${label}.provenance.source 枚举值非法`);
    if (!isBoundedString(outcome.provenance.runner, MAX_RUNNER_LENGTH)) {
      failures.push(`${label}.provenance.runner 必须是 1 到 100 字符`);
    }
    if (!isEvolutionString(outcome.provenance.revision)) failures.push(`${label}.provenance.revision 不能为空`);
    if (outcome.schemaVersion >= 2 && !isEvolutionV2Revision(outcome.provenance.revision)) {
      failures.push(`${label}.provenance.revision 必须绑定完整 Git 或 worktree revision`);
    }
    if (!isEvolutionPositiveInteger(outcome.provenance.trials) || outcome.provenance.trials > MAX_TRIALS) {
      failures.push(`${label}.provenance.trials 必须是正整数且不能超过 10`);
    }
  }
  failures.push(...collectWritebackFailures(outcome, label, maxDate, rootDir));
  failures.push(...collectEvidenceFailures(outcome, label, receiptsById));
  failures.push(...collectNonReflectiveSensitiveFailures(outcome, label));
  return failures;
};
