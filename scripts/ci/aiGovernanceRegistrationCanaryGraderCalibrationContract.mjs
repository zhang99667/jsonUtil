import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

import { isEvolutionRecord } from './aiGovernanceEvolutionEvalContract.mjs';
import { hashEvolutionTraceValue } from './aiGovernanceEvolutionTrace.mjs';
import { REGISTRATION_CANARY_CALIBRATION_MUTATIONS } from './aiGovernanceRegistrationCanaryCalibrationFixtures.mjs';
import { REGISTRATION_CANARY_RESULT } from './aiGovernanceRegistrationCanaryResult.mjs';

export const REGISTRATION_CANARY_GRADER_CALIBRATION_PATH = 'evals/ai-governance/grader-calibration.json';
const GRADER_IMPLEMENTATION_PATH = 'scripts/ci/aiGovernanceRegistrationCanaryResult.mjs';
const FIXTURE_FACTORY_PATH = 'scripts/ci/aiGovernanceRegistrationCanaryCalibrationFixtures.mjs';
const COMPONENT_CASE_ID = 'mcp-registration-canary-result-ingestion-boundary';
const TARGET_CASE_ID = 'mcp-project-registration-discovery';
const ROOT_FIELDS = [
  'schemaVersion', 'calibrationId', 'calibrationVersion', 'dataClass', 'evidenceScope',
  'grader', 'fixture', 'componentCase', 'target', 'rubric', 'thresholds', 'samples',
];
export const REGISTRATION_CANARY_GRADER_CALIBRATION_LABELS = ['pass', 'behavior-fail', 'infrastructure-invalid', 'input-rejected'];
const LABELS = REGISTRATION_CANARY_GRADER_CALIBRATION_LABELS;
const SPLITS = ['gold', 'near-miss', 'adversarial'];
const DIFFICULTIES = new Set(['low', 'medium', 'high']);
const RISKS = new Set(['low', 'medium', 'high']);
const SHA256_PATTERN = /^[0-9a-f]{64}$/;
const ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const METRIC_FIELDS = [
  'exactAgreement', 'macroF1', 'classRecall', 'reasonCodeAgreement',
  'determinism', 'mutationSensitivity', 'deterministicRuns',
];
const MUTATIONS = new Set(REGISTRATION_CANARY_CALIBRATION_MUTATIONS);
const FAILURE_TAXONOMY = Object.freeze({
  pass: ['registration-and-tool-discovered'],
  'behavior-fail': ['server-not-discovered', 'tool-not-discovered', 'trace-policy-not-satisfied'],
  'infrastructure-invalid': [
    'execution-not-complete', 'stdout-not-drained', 'capture-timeout', 'binary-unstable',
    'output-limit-exceeded', 'observation-infrastructure-invalid', 'trace-incomplete',
    'trace-terminal-not-passed', 'forbidden-fallback', 'registry-surface-unavailable',
    'trace-policy-unavailable', 'trace-adapter-mismatch', 'discovery-unavailable',
  ],
  'input-rejected': ['input-rejected'],
});
const EXPECTED_REASON_CODES = new Set(Object.values(FAILURE_TAXONOMY).flat());

const exactFields = (value, fields, label) => {
  if (!isEvolutionRecord(value)) return [`${label} 必须是对象`];
  return JSON.stringify(Object.keys(value).sort()) === JSON.stringify([...fields].sort())
    ? [] : [`${label} 必须是闭字段对象`];
};
const sha256 = value => createHash('sha256').update(value).digest('hex');
const equalReasonCodes = (left, right) => JSON.stringify([...left].sort()) === JSON.stringify([...right].sort());
const ratio = (numerator, denominator) => denominator === 0 ? 0 : numerator / denominator;

const resolveBoundFile = (rootDir, relativePath, label, failures) => {
  if (typeof relativePath !== 'string' || relativePath.length === 0 || path.isAbsolute(relativePath)
    || relativePath.includes('\\') || path.posix.normalize(relativePath) !== relativePath
    || relativePath.split('/').includes('..')) {
    failures.push(`${label} 必须是安全仓库相对路径`);
    return null;
  }
  let canonicalRoot;
  try {
    canonicalRoot = fs.realpathSync(rootDir);
  } catch {
    failures.push('grader calibration 仓库根不可读取');
    return null;
  }
  const absolutePath = path.resolve(canonicalRoot, relativePath);
  const relative = path.relative(canonicalRoot, absolutePath);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    failures.push(`${label} 越出仓库根`);
    return null;
  }
  try {
    const stat = fs.lstatSync(absolutePath);
    const realPath = fs.realpathSync(absolutePath);
    if (!stat.isFile() || stat.isSymbolicLink() || realPath !== absolutePath) {
      failures.push(`${label} 必须是当前无祖先 symlink/realpath 漂移的普通文件`);
      return null;
    }
    return absolutePath;
  } catch {
    failures.push(`${label} 不可读取`);
    return null;
  }
};

export const readRegistrationCanaryGraderCalibration = ({
  rootDir,
  calibrationPath = path.join(rootDir, REGISTRATION_CANARY_GRADER_CALIBRATION_PATH),
} = {}) => {
  const failures = [];
  let raw = '';
  let calibration = null;
  try {
    raw = fs.readFileSync(calibrationPath, 'utf8');
    calibration = JSON.parse(raw);
  } catch {
    failures.push('grader-calibration.json 必须是可读取的合法 JSON');
    return { calibration, calibrationSha256: null, failures };
  }
  failures.push(...exactFields(calibration, ROOT_FIELDS, 'grader calibration'));
  if (calibration.schemaVersion !== 1
    || calibration.calibrationId !== 'registration-canary-blind-result-grader'
    || calibration.calibrationVersion !== '1.1.0'
    || calibration.dataClass !== 'synthetic'
    || calibration.evidenceScope !== 'component-only') failures.push('grader calibration 基础字段非法');

  failures.push(...exactFields(calibration.grader, ['id', 'version', 'implementationPath', 'implementationSha256'], 'grader calibration.grader'));
  if (calibration.grader?.id !== REGISTRATION_CANARY_RESULT.id
    || calibration.grader?.version !== REGISTRATION_CANARY_RESULT.version
    || !SHA256_PATTERN.test(calibration.grader?.implementationSha256 ?? '')) failures.push('grader identity/version/digest 非法');
  if (calibration.grader?.implementationPath !== GRADER_IMPLEMENTATION_PATH) {
    failures.push('grader implementationPath 必须精确绑定实际 import');
  }
  const implementationPath = resolveBoundFile(rootDir, GRADER_IMPLEMENTATION_PATH, 'grader implementationPath', failures);
  if (implementationPath && sha256(fs.readFileSync(implementationPath)) !== calibration.grader.implementationSha256) {
    failures.push('grader implementationSha256 与当前生产实现不一致');
  }

  failures.push(...exactFields(calibration.fixture, ['factoryPath', 'factorySha256'], 'grader calibration.fixture'));
  if (!SHA256_PATTERN.test(calibration.fixture?.factorySha256 ?? '')) failures.push('grader fixture digest 非法');
  if (calibration.fixture?.factoryPath !== FIXTURE_FACTORY_PATH) {
    failures.push('grader fixture.factoryPath 必须精确绑定实际 import');
  }
  const factoryPath = resolveBoundFile(rootDir, FIXTURE_FACTORY_PATH, 'grader fixture.factoryPath', failures);
  if (factoryPath && sha256(fs.readFileSync(factoryPath)) !== calibration.fixture.factorySha256) {
    failures.push('grader fixture.factorySha256 与当前 fixture factory 不一致');
  }

  failures.push(...exactFields(calibration.componentCase, ['id', 'caseVersion', 'subjectVersion', 'caseSha256'], 'grader calibration.componentCase'));
  failures.push(...exactFields(calibration.target, ['caseRef', 'caseSha256', 'policyRef', 'policySha256'], 'grader calibration.target'));
  failures.push(...exactFields(calibration.target?.caseRef, ['id', 'caseVersion', 'subjectVersion'], 'grader calibration.target.caseRef'));
  failures.push(...exactFields(calibration.target?.policyRef, ['id', 'version'], 'grader calibration.target.policyRef'));
  if (calibration.componentCase?.id !== COMPONENT_CASE_ID) failures.push('grader calibration component case ID 非法');
  if (calibration.target?.caseRef?.id !== TARGET_CASE_ID
    || calibration.target?.policyRef?.id !== TARGET_CASE_ID) failures.push('grader calibration target case/policy ID 非法');
  for (const field of [calibration.componentCase?.caseSha256, calibration.target?.caseSha256, calibration.target?.policySha256]) {
    if (!SHA256_PATTERN.test(field ?? '')) failures.push('grader calibration case/policy digest 非法');
  }

  failures.push(...exactFields(calibration.rubric, ['version', 'labels', 'failureTaxonomy'], 'grader calibration.rubric'));
  if (calibration.rubric?.version !== 'registration-canary-blind-grade-v1'
    || JSON.stringify(calibration.rubric?.labels) !== JSON.stringify(LABELS)) failures.push('grader calibration rubric labels/version 非法');
  failures.push(...exactFields(calibration.rubric?.failureTaxonomy, LABELS, 'grader calibration.rubric.failureTaxonomy'));
  const taxonomy = calibration.rubric?.failureTaxonomy ?? {};
  if (JSON.stringify(taxonomy) !== JSON.stringify(FAILURE_TAXONOMY)) {
    failures.push('grader calibration failure taxonomy 必须精确等于独立项目契约');
  }
  const taxonomyCodes = new Set();
  for (const label of LABELS) {
    const codes = taxonomy[label];
    if (!Array.isArray(codes) || codes.length === 0 || codes.some(code => typeof code !== 'string' || !ID_PATTERN.test(code))
      || new Set(codes).size !== codes.length) failures.push(`grader calibration taxonomy ${label} 非法`);
    for (const code of Array.isArray(codes) ? codes : []) {
      if (taxonomyCodes.has(code)) failures.push(`grader calibration reason code ${code} 跨类别重复`);
      taxonomyCodes.add(code);
    }
  }

  failures.push(...exactFields(calibration.thresholds, METRIC_FIELDS, 'grader calibration.thresholds'));
  for (const field of METRIC_FIELDS.filter(field => field !== 'deterministicRuns')) {
    if (calibration.thresholds?.[field] !== 1) failures.push(`确定性 grader threshold ${field} 必须为 1`);
  }
  if (calibration.thresholds?.deterministicRuns !== 3) failures.push('确定性 grader 必须固定运行 3 次');

  if (!Array.isArray(calibration.samples) || calibration.samples.length !== MUTATIONS.size) {
    failures.push(`grader calibration 必须为 ${MUTATIONS.size} 个 mutation 各提供一个独立样本`);
  }
  const ids = new Set();
  const mutations = new Set();
  const observedLabels = new Set();
  const observedSplits = new Set();
  const observedReasonCodes = new Set();
  for (const [index, sample] of (Array.isArray(calibration.samples) ? calibration.samples : []).entries()) {
    const label = `grader calibration.samples[${index}]`;
    failures.push(...exactFields(sample, ['id', 'split', 'difficulty', 'risk', 'mutation', 'oracle'], label));
    failures.push(...exactFields(sample?.oracle, ['label', 'reasonCodes', 'source'], `${label}.oracle`));
    if (!ID_PATTERN.test(sample?.id ?? '') || ids.has(sample?.id)) failures.push(`${label}.id 非法或重复`);
    ids.add(sample?.id);
    if (!SPLITS.includes(sample?.split)) failures.push(`${label}.split 非法`); else observedSplits.add(sample.split);
    if (!DIFFICULTIES.has(sample?.difficulty) || !RISKS.has(sample?.risk)) failures.push(`${label}.difficulty/risk 非法`);
    if (!MUTATIONS.has(sample?.mutation) || mutations.has(sample?.mutation)) failures.push(`${label}.mutation 非法或重复`);
    mutations.add(sample?.mutation);
    if (!LABELS.includes(sample?.oracle?.label)) failures.push(`${label}.oracle.label 非法`); else observedLabels.add(sample.oracle.label);
    const reasons = sample?.oracle?.reasonCodes;
    if (!Array.isArray(reasons) || reasons.length === 0 || new Set(reasons).size !== reasons.length
      || reasons.some(code => !taxonomy[sample?.oracle?.label]?.includes(code))) failures.push(`${label}.oracle.reasonCodes 不属于该类别 taxonomy`);
    for (const reason of Array.isArray(reasons) ? reasons : []) observedReasonCodes.add(reason);
    if (sample?.oracle?.source !== 'project-contract') failures.push(`${label}.oracle.source 必须是 project-contract`);
  }
  if (JSON.stringify([...observedSplits].sort()) !== JSON.stringify([...SPLITS].sort())) failures.push('grader calibration 必须覆盖 gold/near-miss/adversarial splits');
  if (JSON.stringify([...observedLabels].sort()) !== JSON.stringify([...LABELS].sort())) failures.push('grader calibration 必须覆盖四种 grader label');
  if (JSON.stringify([...mutations].sort()) !== JSON.stringify([...MUTATIONS].sort())) failures.push('grader calibration 必须逐一覆盖完整 mutation 集合');
  if (JSON.stringify([...observedReasonCodes].sort()) !== JSON.stringify([...EXPECTED_REASON_CODES].sort())) {
    failures.push('grader calibration oracle 必须逐一覆盖完整 reason taxonomy');
  }
  return { calibration, calibrationSha256: sha256(raw), failures };
};
