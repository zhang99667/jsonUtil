import {
  collectEvolutionSensitiveFieldFailures,
  isEvolutionRecord,
} from './aiGovernanceEvolutionEvalContract.mjs';
import {
  collectEvolutionPairedAssignmentFailures,
} from './aiGovernanceEvolutionPairedReceiptV4Assignment.mjs';
import {
  parseRegistrationCanaryExactCompactJson,
} from './aiGovernanceRegistrationCanaryDsseEnvelope.mjs';

export const AI_EVOLUTION_PAIRED_RECEIPT_V4_MAX_BYTES = 512 * 1024;

const SHA256_PATTERN = /^[0-9a-f]{64}$/;
const SAFE_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:/@-]{0,127}$/;
const BLIND_ALIAS_PATTERN = /^b-[a-z0-9]{16,64}$/;
const SIDE_CHANNEL_PATTERN = /(?:baseline|candidate|arm|trial|pair|plugin|treatment|lease)/i;
const BATCH_FIELDS = [
  'schemaVersion', 'artifactType', 'dataClass', 'experimentRef', 'caseRef', 'fixtureRef',
  'environmentRef', 'policyRef', 'rubricSha256', 'assignment', 'checkpoint', 'trialResults', 'proof',
];
const EXPERIMENT_FIELDS = ['id', 'manifestVersion', 'contractVersion', 'sha256'];
const CASE_FIELDS = ['id', 'corpusVersion', 'caseVersion', 'subjectVersion', 'sha256'];
const FIXTURE_FIELDS = ['path', 'evalId', 'sha256'];
const ENVIRONMENT_FIELDS = ['sha256', 'manifestSha256', 'revision'];
const POLICY_FIELDS = ['id', 'version', 'sha256'];
const CHECKPOINT_FIELDS = [
  'schemaVersion', 'gradeCount', 'gradeSetSha256', 'assignmentEnvelopeSha256',
];
const PROOF_FIELDS = ['assignmentEnvelope', 'checkpointEnvelope', 'batchEnvelope'];
const TRIAL_FIELDS = [
  'trialId', 'pair', 'arm', 'executionOrdinal', 'blindAlias', 'resultSha256',
  'gradeSha256', 'infrastructure', 'grade', 'execution', 'trace',
];
const INFRASTRUCTURE_FIELDS = ['status', 'reasonCodes'];
const GRADE_FIELDS = ['status', 'verdict', 'score', 'reasonCodes'];
const EXECUTION_FIELDS = [
  'modelId', 'cliVersion', 'binarySha256', 'stdoutSha256', 'exitCode', 'stdoutDrained',
  'timedOut', 'binaryStable', 'execArgsSha256', 'adapterBundleSha256', 'leaseKeySha256',
  'taskInstanceSha256', 'leaseAcquireCount', 'executionCount', 'retryCount',
  'freshTaskObserved', 'armIsolationObserved', 'artifactBindingsStable', 'ledgerBindingsStable',
];

const exactFieldFailures = (value, fields, label) => {
  if (!isEvolutionRecord(value)) return [`${label} 必须是对象`];
  const actual = Object.keys(value).sort();
  const expected = [...fields].sort();
  return JSON.stringify(actual) === JSON.stringify(expected) ? [] : [`${label} 必须是闭字段对象`];
};
export const isEvolutionPairedSha256 = value => (
  typeof value === 'string' && SHA256_PATTERN.test(value)
);
const isSafeId = value => typeof value === 'string' && SAFE_ID_PATTERN.test(value);
export const areEvolutionPairedJsonEqual = (left, right) => (
  JSON.stringify(left) === JSON.stringify(right)
);
const pushShaFailures = (failures, value, fields, label) => fields.forEach((field) => {
  if (!isEvolutionPairedSha256(value?.[field])) failures.push(`${label}.${field} 必须是小写 SHA-256`);
});

const collectReferenceFailures = (batch) => {
  const failures = [
    ...exactFieldFailures(batch.experimentRef, EXPERIMENT_FIELDS, 'paired batch.experimentRef'),
    ...exactFieldFailures(batch.caseRef, CASE_FIELDS, 'paired batch.caseRef'),
    ...exactFieldFailures(batch.fixtureRef, FIXTURE_FIELDS, 'paired batch.fixtureRef'),
    ...exactFieldFailures(batch.environmentRef, ENVIRONMENT_FIELDS, 'paired batch.environmentRef'),
    ...exactFieldFailures(batch.policyRef, POLICY_FIELDS, 'paired batch.policyRef'),
    ...exactFieldFailures(batch.checkpoint, CHECKPOINT_FIELDS, 'paired batch.checkpoint'),
    ...exactFieldFailures(batch.proof, PROOF_FIELDS, 'paired batch.proof'),
  ];
  if (!isSafeId(batch.experimentRef?.id) || !isSafeId(batch.experimentRef?.manifestVersion)
    || batch.experimentRef?.contractVersion !== 2) failures.push('paired batch.experimentRef 非法');
  if (!isSafeId(batch.caseRef?.id) || !isSafeId(batch.caseRef?.corpusVersion)
    || !Number.isInteger(batch.caseRef?.caseVersion) || batch.caseRef.caseVersion < 1
    || !isSafeId(batch.caseRef?.subjectVersion)) failures.push('paired batch.caseRef 非法');
  if (batch.fixtureRef?.path !== '.agents/skills/jsonutils-ai-infra-evolver/evals/evals.json'
    || batch.fixtureRef?.evalId !== 1) failures.push('paired batch.fixtureRef 非法');
  if (!isSafeId(batch.policyRef?.id) || !isSafeId(batch.policyRef?.version)) {
    failures.push('paired batch.policyRef 非法');
  }
  pushShaFailures(failures, batch.experimentRef, ['sha256'], 'paired batch.experimentRef');
  pushShaFailures(failures, batch.caseRef, ['sha256'], 'paired batch.caseRef');
  pushShaFailures(failures, batch.fixtureRef, ['sha256'], 'paired batch.fixtureRef');
  pushShaFailures(failures, batch.environmentRef, ['sha256', 'manifestSha256'], 'paired batch.environmentRef');
  pushShaFailures(failures, batch.policyRef, ['sha256'], 'paired batch.policyRef');
  if (!isSafeId(batch.environmentRef?.revision)) failures.push('paired batch.environmentRef.revision 非法');
  if (!isEvolutionPairedSha256(batch.rubricSha256)) failures.push('paired batch.rubricSha256 必须是小写 SHA-256');
  if (batch.checkpoint?.schemaVersion !== 1 || batch.checkpoint?.gradeCount !== 6
    || !isEvolutionPairedSha256(batch.checkpoint?.gradeSetSha256)) failures.push('paired batch.checkpoint 非法');
  for (const field of PROOF_FIELDS) {
    if (typeof batch.proof?.[field] !== 'string' || batch.proof[field].length === 0) {
      failures.push(`paired batch.proof.${field} 必须是紧凑 DSSE JSON 字符串`);
    }
  }
  return failures;
};

const collectExecutionShapeFailures = (execution, label) => {
  const failures = exactFieldFailures(execution, EXECUTION_FIELDS, label);
  if (!isSafeId(execution?.modelId) || !isSafeId(execution?.cliVersion)) {
    failures.push(`${label}.modelId/cliVersion 非法`);
  }
  pushShaFailures(failures, execution, [
    'binarySha256', 'stdoutSha256', 'execArgsSha256', 'adapterBundleSha256',
    'leaseKeySha256', 'taskInstanceSha256',
  ], label);
  if (!Number.isInteger(execution?.exitCode) || execution.exitCode < -255 || execution.exitCode > 255) {
    failures.push(`${label}.exitCode 必须是 -255 到 255 的整数`);
  }
  for (const field of [
    'stdoutDrained', 'timedOut', 'binaryStable', 'freshTaskObserved', 'armIsolationObserved',
    'artifactBindingsStable', 'ledgerBindingsStable',
  ]) if (typeof execution?.[field] !== 'boolean') failures.push(`${label}.${field} 必须是布尔值`);
  for (const field of ['leaseAcquireCount', 'executionCount', 'retryCount']) {
    if (!Number.isInteger(execution?.[field]) || execution[field] < 0) {
      failures.push(`${label}.${field} 必须是非负整数`);
    }
  }
  return failures;
};

const collectTrialShapeFailures = (trial, index) => {
  const label = `paired batch.trialResults[${index}]`;
  const failures = exactFieldFailures(trial, TRIAL_FIELDS, label);
  if (!isSafeId(trial?.trialId) || ![1, 2, 3].includes(trial?.pair)
    || !['baseline', 'candidate'].includes(trial?.arm)
    || trial?.executionOrdinal !== index + 1) failures.push(`${label} trial mapping 非法`);
  if (!BLIND_ALIAS_PATTERN.test(trial?.blindAlias ?? '') || SIDE_CHANNEL_PATTERN.test(trial?.blindAlias ?? '')) {
    failures.push(`${label}.blindAlias 必须是无 arm/pair/trial 侧信道的 blind id`);
  }
  if (!isEvolutionPairedSha256(trial?.resultSha256)
    || !isEvolutionPairedSha256(trial?.gradeSha256)) failures.push(`${label} result/grade digest 非法`);
  failures.push(...exactFieldFailures(trial?.infrastructure, INFRASTRUCTURE_FIELDS, `${label}.infrastructure`));
  failures.push(...exactFieldFailures(trial?.grade, GRADE_FIELDS, `${label}.grade`));
  if (!['valid', 'invalid'].includes(trial?.infrastructure?.status)
    || !Array.isArray(trial?.infrastructure?.reasonCodes)
    || !trial.infrastructure.reasonCodes.every(isSafeId)) failures.push(`${label}.infrastructure 非法`);
  if (!['graded', 'ungradable'].includes(trial?.grade?.status)
    || !Array.isArray(trial?.grade?.reasonCodes)
    || !trial.grade.reasonCodes.every(isSafeId)) failures.push(`${label}.grade 非法`);
  failures.push(...collectExecutionShapeFailures(trial?.execution, `${label}.execution`));
  return failures;
};

const collectBatchShapeFailures = (batch) => {
  const failures = exactFieldFailures(batch, BATCH_FIELDS, 'paired batch');
  if (batch?.schemaVersion !== 1 || batch?.artifactType !== 'ai-evolution-paired-trial-batch'
    || batch?.dataClass !== 'redacted') failures.push('paired batch 基础字段非法');
  failures.push(...collectReferenceFailures(batch));
  const trials = Array.isArray(batch?.trialResults) ? batch.trialResults : [];
  if (trials.length !== 6) failures.push('paired batch.trialResults 必须精确包含 3 对 6 条');
  trials.forEach((trial, index) => failures.push(...collectTrialShapeFailures(trial, index)));
  failures.push(...collectEvolutionPairedAssignmentFailures({ batch }));
  if (new Set(trials.map(item => item?.blindAlias)).size !== trials.length) {
    failures.push('paired batch blindAlias 必须唯一');
  }
  if (new Set(trials.map(item => item?.execution?.leaseKeySha256)).size !== trials.length
    || new Set(trials.map(item => item?.execution?.taskInstanceSha256)).size !== trials.length) {
    failures.push('paired batch 每次执行必须使用唯一 lease 与 fresh task instance');
  }
  failures.push(...collectEvolutionSensitiveFieldFailures(batch, 'paired batch'));
  return failures;
};

export const parseEvolutionPairedBatchArtifact = (text) => {
  const batch = parseRegistrationCanaryExactCompactJson(text, {
    label: 'paired batch stdin', maxBytes: AI_EVOLUTION_PAIRED_RECEIPT_V4_MAX_BYTES,
  });
  const failures = collectBatchShapeFailures(batch);
  if (failures.length > 0) throw new TypeError(failures.join('；'));
  return batch;
};

export const normalizeEvolutionPairedBatchArtifact = (batch) => {
  let text;
  try { text = JSON.stringify(batch); } catch { throw new TypeError('paired batch 不是合法 JSON 值'); }
  return parseEvolutionPairedBatchArtifact(text);
};
