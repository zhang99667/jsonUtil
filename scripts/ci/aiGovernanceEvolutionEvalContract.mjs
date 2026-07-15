import fs from 'node:fs';
import path from 'node:path';

import { collectFutureIsoDateFailures, getLocalIsoDate } from './aiGovernanceDateBounds.mjs';
import {
  collectEvolutionSensitiveFieldFailures,
  collectEvolutionSensitiveValueFailures,
} from './aiGovernanceEvolutionSensitiveData.mjs';
import { readStableEvolutionSnapshotFile } from './aiGovernanceEvolutionSnapshotPrimitives.mjs';
import { isIsoCalendarDate } from './aiGovernanceIsoDate.mjs';

export { collectEvolutionSensitiveFieldFailures, collectEvolutionSensitiveValueFailures };

const CASE_ID_PATTERN = /^[a-z][a-z0-9-]*$/;
const CORPUS_VERSION_PATTERN = /^\d+\.\d+\.\d+$/;
const SUBJECT_VERSION_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/;
const CASE_MODES = new Set(['positive', 'negative', 'near-negative']);
const COVERAGE_CLASSES = new Set(['behavior', 'component-boundary']);
const SUBJECT_KINDS = new Set(['rule', 'skill', 'delegation', 'mcp', 'hook', 'validation', 'rule-evolution']);
const DATA_CLASSES = new Set(['synthetic', 'redacted']);
const ROOT_FIELDS = new Set(['schemaVersion', 'corpusVersion', 'updatedAt', 'cases', 'retiredCaseIds']);
const CASE_FIELDS = new Set(['id', 'caseVersion', 'coverageClass', 'subject', 'mode', 'input', 'expectedOutcome', 'graders', 'tags', 'sources']);
const SUBJECT_FIELDS = new Set(['kind', 'id', 'version']);
const INPUT_FIELDS = new Set(['dataClass', 'request', 'context']);
const EXPECTED_OUTCOME_FIELDS = new Set(['summary', 'requiredEvidence', 'forbiddenActions']);
const GRADER_FIELDS = new Set(['deterministic', 'model', 'human']);

export const AI_EVOLUTION_EVAL_CORPUS_MAX_BYTES = 1024 * 1024;
const strictUtf8 = new TextDecoder('utf-8', { fatal: true });

export const isEvolutionRecord = value => Boolean(value) && typeof value === 'object' && !Array.isArray(value);
export const isEvolutionString = value => typeof value === 'string' && value.trim().length > 0;
export const isEvolutionPositiveInteger = value => Number.isInteger(value) && value > 0;
export const isEvolutionCorpusVersion = value => typeof value === 'string' && CORPUS_VERSION_PATTERN.test(value);
export const isEvolutionSubjectVersion = value => typeof value === 'string' && SUBJECT_VERSION_PATTERN.test(value);

export const collectEvolutionIsoDateFailures = (label, value, maxDate) => {
  if (!isIsoCalendarDate(value)) return [`${label} 必须是有效的 YYYY-MM-DD 日期`];
  return collectFutureIsoDateFailures(label, '日期', value, maxDate);
};

const collectStringArrayFailures = (label, value) => {
  if (!Array.isArray(value) || value.length === 0 || !value.every(isEvolutionString)) {
    return [`${label} 必须是非空字符串数组`];
  }
  return new Set(value).size === value.length ? [] : [`${label} 不能包含重复项`];
};

const collectClosedFieldFailures = (value, allowed, failure) => Object.keys(value)
  .some(field => !allowed.has(field)) ? [failure] : [];

const collectCaseFailures = (item, index, closedShapeFailures) => {
  const label = `cases.json: 第 ${index + 1} 个 case`;
  if (!isEvolutionRecord(item)) return [`${label} 必须是对象`];
  const failures = [];
  const caseShapeFailures = collectClosedFieldFailures(item, CASE_FIELDS, `${label} 必须是闭字段对象`);
  failures.push(...caseShapeFailures); closedShapeFailures.push(...caseShapeFailures);
  if (!CASE_ID_PATTERN.test(item.id ?? '')) failures.push(`${label}.id 必须是稳定的 kebab-case`);
  if (!isEvolutionPositiveInteger(item.caseVersion)) failures.push(`${label}.caseVersion 必须是正整数`);
  if (!COVERAGE_CLASSES.has(item.coverageClass)) failures.push(`${label}.coverageClass 枚举值非法`);
  if (!CASE_MODES.has(item.mode)) failures.push(`${label}.mode 枚举值非法`);
  if (!isEvolutionRecord(item.subject)) failures.push(`${label}.subject 必须是对象`);
  else {
    const shapeFailures = collectClosedFieldFailures(item.subject, SUBJECT_FIELDS, `${label}.subject 必须是闭字段对象`);
    failures.push(...shapeFailures); closedShapeFailures.push(...shapeFailures);
    if (!SUBJECT_KINDS.has(item.subject.kind)) failures.push(`${label}.subject.kind 枚举值非法`);
    if (!isEvolutionString(item.subject.id)) failures.push(`${label}.subject.id 不能为空`);
    if (!isEvolutionSubjectVersion(item.subject.version)) failures.push(`${label}.subject.version 必须是安全的稳定版本标识`);
  }
  if (!isEvolutionRecord(item.input)) failures.push(`${label}.input 必须是对象`);
  else {
    const shapeFailures = collectClosedFieldFailures(item.input, INPUT_FIELDS, `${label}.input 必须是闭字段对象`);
    failures.push(...shapeFailures); closedShapeFailures.push(...shapeFailures);
    if (!DATA_CLASSES.has(item.input.dataClass)) failures.push(`${label}.input.dataClass 枚举值非法`);
    if (!isEvolutionString(item.input.request)) failures.push(`${label}.input.request 不能为空`);
    if (!isEvolutionString(item.input.context)) failures.push(`${label}.input.context 不能为空`);
  }
  if (!isEvolutionRecord(item.expectedOutcome)) failures.push(`${label}.expectedOutcome 必须是对象`);
  else {
    const shapeFailures = collectClosedFieldFailures(item.expectedOutcome, EXPECTED_OUTCOME_FIELDS, `${label}.expectedOutcome 必须是闭字段对象`);
    failures.push(...shapeFailures); closedShapeFailures.push(...shapeFailures);
    if (!isEvolutionString(item.expectedOutcome.summary)) failures.push(`${label}.expectedOutcome.summary 不能为空`);
    failures.push(...collectStringArrayFailures(`${label}.expectedOutcome.requiredEvidence`, item.expectedOutcome.requiredEvidence));
    failures.push(...collectStringArrayFailures(`${label}.expectedOutcome.forbiddenActions`, item.expectedOutcome.forbiddenActions));
  }
  if (!isEvolutionRecord(item.graders)) failures.push(`${label}.graders 必须是对象`);
  else {
    const shapeFailures = collectClosedFieldFailures(item.graders, GRADER_FIELDS, `${label}.graders 必须是闭字段对象`);
    failures.push(...shapeFailures); closedShapeFailures.push(...shapeFailures);
    GRADER_FIELDS.forEach((kind) => {
      if (!isEvolutionString(item.graders[kind])) failures.push(`${label}.graders.${kind} 描述不能为空`);
    });
  }
  failures.push(...collectStringArrayFailures(`${label}.tags`, item.tags));
  failures.push(...collectStringArrayFailures(`${label}.sources`, item.sources));
  const isComponentBoundary = item.coverageClass === 'component-boundary';
  const hasComponentOnlyTag = Array.isArray(item.tags) && item.tags.includes('component-only');
  if (isComponentBoundary !== hasComponentOnlyTag) {
    failures.push(`${label}.coverageClass 必须与 component-only tag 一致`);
  }
  return failures;
};

const countCases = (cases, predicate) => cases.filter(predicate).length;
const hasTag = (item, tag) => Array.isArray(item?.tags) && item.tags.includes(tag);
const hasSubject = (item, kind, mode) => item?.subject?.kind === kind && (!mode || item.mode === mode);

const buildCoverage = cases => ({
  coverageClass: {
    total: cases.length,
    behavior: countCases(cases, item => item.coverageClass === 'behavior'),
    componentBoundary: countCases(cases, item => item.coverageClass === 'component-boundary'),
  },
  ruleFollowing: countCases(cases, item => hasSubject(item, 'rule')),
  skillTrigger: {
    positive: countCases(cases, item => hasSubject(item, 'skill', 'positive')),
    nearNegative: countCases(cases, item => hasSubject(item, 'skill', 'near-negative')),
  },
  delegation: {
    positive: countCases(cases, item => hasSubject(item, 'delegation', 'positive')),
    negative: countCases(cases, item => hasSubject(item, 'delegation', 'negative')),
  },
  mcp: {
    selection: countCases(cases, item => hasSubject(item, 'mcp') && hasTag(item, 'mcp-selection')),
    readonly: countCases(cases, item => hasSubject(item, 'mcp') && hasTag(item, 'mcp-readonly')),
    protocol: countCases(cases, item => hasSubject(item, 'mcp') && hasTag(item, 'mcp-protocol')),
  },
  hook: countCases(cases, item => hasSubject(item, 'hook')),
  validation: countCases(cases, item => hasSubject(item, 'validation')),
  ruleEvolution: countCases(cases, item => hasSubject(item, 'rule-evolution')),
  security: countCases(cases, item => hasTag(item, 'security')),
});

const collectCoverageFailures = coverage => [
  [coverage.ruleFollowing, 'rule-following'],
  [coverage.skillTrigger.positive, 'skill-trigger 正例'],
  [coverage.skillTrigger.nearNegative, 'skill-trigger 近似负例'],
  [coverage.delegation.positive, 'delegation 正例'],
  [coverage.delegation.negative, 'delegation 负例'],
  [coverage.mcp.selection, 'MCP selection'],
  [coverage.mcp.readonly, 'MCP readonly'],
  [coverage.mcp.protocol, 'MCP protocol'],
  [coverage.hook, 'hook'],
  [coverage.validation, 'validation'],
  [coverage.ruleEvolution, 'rule-evolution'],
  [coverage.security, 'security'],
].filter(([count]) => count === 0).map(([, label]) => `cases.json: 缺少 ${label} case`);

const buildEmptyCorpusResult = failure => ({
  corpus: {}, cases: [], retiredCaseIds: [], coverage: buildCoverage([]), failures: [failure],
});

export const readEvolutionEvalCorpus = (filePath, { maxDate = getLocalIsoDate() } = {}) => {
  let bytes;
  try {
    const absolutePath = path.resolve(filePath);
    const canonicalParent = fs.realpathSync(path.dirname(absolutePath));
    ({ bytes } = readStableEvolutionSnapshotFile(
      canonicalParent, path.basename(absolutePath), AI_EVOLUTION_EVAL_CORPUS_MAX_BYTES,
    ));
  } catch {
    return buildEmptyCorpusResult('cases.json: 无法读取稳定的有界普通文件');
  }
  let source;
  try { source = strictUtf8.decode(bytes); }
  catch { return buildEmptyCorpusResult('cases.json: 必须是合法 UTF-8'); }
  let corpus;
  try { corpus = JSON.parse(source); }
  catch { return buildEmptyCorpusResult('cases.json: 无法解析 JSON'); }
  const failures = [];
  const root = isEvolutionRecord(corpus) ? corpus : {};
  if (root !== corpus) failures.push('cases.json: 根节点必须是对象');
  const closedShapeFailures = root === corpus
    ? collectClosedFieldFailures(root, ROOT_FIELDS, 'cases.json: 根节点必须是闭字段对象') : [];
  failures.push(...closedShapeFailures);
  if (root.schemaVersion !== 1) failures.push('cases.json: schemaVersion 必须为 1');
  if (!isEvolutionCorpusVersion(root.corpusVersion)) failures.push('cases.json: corpusVersion 必须是 x.y.z');
  failures.push(...collectEvolutionIsoDateFailures('cases.json: updatedAt', root.updatedAt, maxDate));
  const cases = Array.isArray(root.cases) ? root.cases : [];
  if (!Array.isArray(root.cases)) failures.push('cases.json: cases 必须是数组');
  if (cases.length < 10 || cases.length > 38) failures.push('cases.json: cases 数量必须在 10 到 38 之间');
  cases.forEach((item, index) => failures.push(...collectCaseFailures(item, index, closedShapeFailures)));
  const ids = cases.map(item => item?.id).filter(Boolean);
  if (new Set(ids).size !== ids.length) failures.push('cases.json: case id 必须唯一');
  const retiredCaseIds = root.retiredCaseIds === undefined ? [] : root.retiredCaseIds;
  if (!Array.isArray(retiredCaseIds) || !retiredCaseIds.every(id => CASE_ID_PATTERN.test(id))) {
    failures.push('cases.json: retiredCaseIds 必须是 kebab-case 字符串数组');
  } else {
    if (new Set(retiredCaseIds).size !== retiredCaseIds.length) failures.push('cases.json: retiredCaseIds 不能重复');
    if (retiredCaseIds.some(id => ids.includes(id))) failures.push('cases.json: active case 与 retiredCaseIds 不能重叠');
  }
  const coverage = buildCoverage(cases);
  failures.push(...collectCoverageFailures(coverage));
  if (closedShapeFailures.length === 0) failures.push(...collectEvolutionSensitiveFieldFailures(corpus, 'cases.json'));
  return { corpus, cases, retiredCaseIds: Array.isArray(retiredCaseIds) ? retiredCaseIds : [], coverage, failures };
};
