import fs from 'node:fs';
import path from 'node:path';

import { getLocalIsoDate } from './aiGovernanceDateBounds.mjs';
import {
  collectEvolutionSensitiveFieldFailures,
  isEvolutionRecord,
  readEvolutionEvalCorpus,
} from './aiGovernanceEvolutionEvalContract.mjs';
import { readEvolutionExperiments } from './aiGovernanceEvolutionExperiments.mjs';
import {
  collectEvolutionPairedAssignmentFailures,
  verifyEvolutionPairedArmPolicy,
} from './aiGovernanceEvolutionPairedReceiptV4Assignment.mjs';
import {
  hashEvolutionPairedGrade,
  hashEvolutionPairedGradeSet,
  hashEvolutionPairedValue,
  verifyEvolutionPairedProofs,
} from './aiGovernanceEvolutionPairedReceiptV4Proof.mjs';
import { hashEvolutionTraceValue, verifyEvolutionTraceReceipt } from './aiGovernanceEvolutionTrace.mjs';
import {
  buildEvolutionTracePolicyRegistry,
} from './aiGovernanceEvolutionTracePolicies.mjs';
import {
  hashRegistrationCanaryExactBytes,
  parseRegistrationCanaryExactCompactJson,
} from './aiGovernanceRegistrationCanaryDsseEnvelope.mjs';

export const AI_EVOLUTION_PAIRED_RECEIPT_V4_MAX_BYTES = 512 * 1024;
export const AI_EVOLUTION_PAIRED_RUNNER = 'external-paired-skill-trial@1.0.0';
export const AI_EVOLUTION_PAIRED_VALIDATION_COMMAND = 'internal:verify-paired-receipt-v4@1';
export const AI_EVOLUTION_PAIRED_VALIDATION_EVIDENCE =
  '固定 paired v4 verifier 已校验 pre-execution assignment、六次 trace、基础设施事实、grade commitment 与三角色未见证 proof';

const EXPERIMENT_DOMAIN = 'jsonutils.ai-evolution.paired-experiment/v1';
const RUBRIC_DOMAIN = 'jsonutils.ai-evolution.paired-rubric/v1';
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
const isSha256 = value => typeof value === 'string' && SHA256_PATTERN.test(value);
const isSafeId = value => typeof value === 'string' && SAFE_ID_PATTERN.test(value);
const sameJson = (left, right) => JSON.stringify(left) === JSON.stringify(right);
const pushShaFailures = (failures, value, fields, label) => fields.forEach((field) => {
  if (!isSha256(value?.[field])) failures.push(`${label}.${field} 必须是小写 SHA-256`);
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
  if (!isSha256(batch.rubricSha256)) failures.push('paired batch.rubricSha256 必须是小写 SHA-256');
  if (batch.checkpoint?.schemaVersion !== 1 || batch.checkpoint?.gradeCount !== 6
    || !isSha256(batch.checkpoint?.gradeSetSha256)) failures.push('paired batch.checkpoint 非法');
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
  if (!isSha256(trial?.resultSha256) || !isSha256(trial?.gradeSha256)) {
    failures.push(`${label} result/grade digest 非法`);
  }
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

const normalizedBatch = (batch) => {
  let text;
  try { text = JSON.stringify(batch); } catch { throw new TypeError('paired batch 不是合法 JSON 值'); }
  return parseEvolutionPairedBatchArtifact(text);
};

export const buildEvolutionPairedExperimentRef = ({ manifest, experiment }) => ({
  id: experiment.id,
  manifestVersion: manifest.manifestVersion,
  contractVersion: experiment.contractVersion,
  sha256: hashEvolutionPairedValue(EXPERIMENT_DOMAIN, experiment),
});

export const buildEvolutionPairedCaseRef = ({ corpus, caseItem }) => ({
  id: caseItem.id,
  corpusVersion: corpus.corpusVersion,
  caseVersion: caseItem.caseVersion,
  subjectVersion: caseItem.subject.version,
  sha256: hashEvolutionTraceValue(caseItem),
});

export const hashEvolutionPairedRubric = caseItem => hashEvolutionPairedValue(RUBRIC_DOMAIN, {
  expectedOutcome: caseItem.expectedOutcome,
  graders: caseItem.graders,
});

const deriveInfrastructureReasons = (trial, traceVerification, armPolicyVerification) => [
  ...(trial.arm === 'baseline' && armPolicyVerification.status !== 'verified'
    ? ['baseline-treatment-invalid'] : []),
  ...(!trial.execution ? ['execution-facts-missing'] : []),
  ...(trial.execution?.exitCode === 0 ? [] : ['nonzero-exit']),
  ...(trial.execution?.stdoutDrained ? [] : ['stdout-not-drained']),
  ...(trial.execution?.timedOut ? ['timed-out'] : []),
  ...(trial.execution?.binaryStable ? [] : ['binary-drift']),
  ...(trial.execution?.leaseAcquireCount === 1 ? [] : ['lease-acquire-count-invalid']),
  ...(trial.execution?.executionCount === 1 ? [] : ['execution-count-invalid']),
  ...(trial.execution?.retryCount === 0 ? [] : ['retry-detected']),
  ...(trial.execution?.freshTaskObserved ? [] : ['fresh-task-not-observed']),
  ...(trial.execution?.armIsolationObserved ? [] : ['arm-isolation-not-observed']),
  ...(trial.execution?.artifactBindingsStable ? [] : ['artifact-binding-drift']),
  ...(trial.execution?.ledgerBindingsStable ? [] : ['ledger-binding-drift']),
  ...(traceVerification.completeness.status === 'complete' ? [] : ['trace-incomplete']),
];

const expectedGrade = ({ arm, infrastructureReasons, policyVerification, grade }) => {
  if (infrastructureReasons.length > 0) return {
    status: 'ungradable', verdict: null, score: null, reasonCodes: infrastructureReasons,
  };
  if (arm === 'candidate' && policyVerification.status !== 'verified') return {
    status: 'graded', verdict: 'fail', score: 0, reasonCodes: ['trace-policy-rejected'],
  };
  if (grade?.verdict === 'pass') return {
    status: 'graded', verdict: 'pass', score: 100, reasonCodes: ['rubric-pass'],
  };
  return { status: 'graded', verdict: 'fail', score: 0, reasonCodes: ['rubric-fail'] };
};

const responseDigest = (trace) => {
  const rootActorId = trace?.events?.find(event => event?.type === 'session.start')?.actorId;
  return trace?.events?.find(event => (
    event?.type === 'response.finish' && event.actorId === rootActorId
  ))?.sha256;
};

const collectTrialSemanticFailures = ({ trial, caseRef, policyEntry, revision, index }) => {
  const label = `paired batch.trialResults[${index}]`;
  const traceVerification = verifyEvolutionTraceReceipt({
    revision, validations: [], trace: trial.trace,
  }, { expectedCaseSha256: caseRef.sha256, expectedPolicy: policyEntry.descriptor });
  const failures = traceVerification.failures.map(failure => `${label}.trace: ${failure}`);
  const policyVerification = verifyEvolutionPairedArmPolicy({ trial, policyEntry });
  if (policyVerification.status === 'error') {
    failures.push(...policyVerification.failures.map(failure => `${label}.trace policy error: ${failure}`));
  }
  const infrastructureReasons = deriveInfrastructureReasons(trial, traceVerification, policyVerification);
  const expectedInfrastructure = {
    status: infrastructureReasons.length === 0 ? 'valid' : 'invalid',
    reasonCodes: infrastructureReasons,
  };
  if (!sameJson(trial.infrastructure, expectedInfrastructure)) {
    failures.push(`${label}.infrastructure 必须由执行事实与 trace 完整性派生`);
  }
  const grade = expectedGrade({
    arm: trial.arm, infrastructureReasons, policyVerification, grade: trial.grade,
  });
  if (!sameJson(trial.grade, grade)) failures.push(`${label}.grade 与 infrastructure/policy/rubric 枚举不一致`);
  if (hashEvolutionPairedGrade(trial.grade) !== trial.gradeSha256) {
    failures.push(`${label}.gradeSha256 与闭字段 grade 不一致`);
  }
  if (responseDigest(trial.trace) !== trial.resultSha256) {
    failures.push(`${label}.resultSha256 必须绑定 trace response.finish.sha256`);
  }
  return { failures, traceVerification, policyVerification, infrastructureReasons };
};

const collectSharedExecutionFailures = (trials) => {
  if (trials.length !== 6) return [];
  const sharedFields = ['modelId', 'cliVersion', 'binarySha256', 'execArgsSha256', 'adapterBundleSha256'];
  return sharedFields.flatMap((field) => (
    trials.every(item => item.execution?.[field] === trials[0].execution?.[field])
      ? [] : [`paired batch 六次执行的 ${field} 必须一致`]
  ));
};

export const aggregateEvolutionPairedCandidateResults = (trialResults) => {
  const candidates = trialResults.filter(item => item.arm === 'candidate');
  if (trialResults.length !== 6 || candidates.length !== 3
    || trialResults.some(item => item.infrastructure?.status !== 'valid'
      || item.grade?.status !== 'graded')) return undefined;
  const verdicts = candidates.map(item => item.grade.verdict);
  const verdict = verdicts.every(item => item === 'pass')
    ? 'pass' : verdicts.every(item => item === 'fail') ? 'fail' : 'partial';
  const score = Math.round(candidates.reduce((sum, item) => sum + item.grade.score, 0) / 3);
  return { verdict, score, trials: 3 };
};

const loadPairedContext = ({ rootDir, batch, maxDate }) => {
  const corpusResult = readEvolutionEvalCorpus(path.join(rootDir, 'evals/ai-governance/cases.json'), { maxDate });
  const casesById = new Map(corpusResult.cases.map(item => [item.id, item]));
  const experiments = readEvolutionExperiments(
    path.join(rootDir, 'evals/ai-governance/experiments.json'),
    { casesById, maxDate },
  );
  const policies = buildEvolutionTracePolicyRegistry({ rootDir });
  const failures = [...corpusResult.failures, ...experiments.failures, ...policies.failures];
  const experiment = experiments.experiments.find(item => item.id === batch.experimentRef.id);
  const caseItem = casesById.get(batch.caseRef.id);
  const policyEntry = policies.policiesByCaseId.get(batch.caseRef.id);
  if (!experiment) failures.push('paired batch 引用了未知 experiment');
  if (!caseItem) failures.push('paired batch 引用了未知 case');
  if (!policyEntry) failures.push('paired batch case 缺少当前 trace policy');
  return { corpusResult, experiments, experiment, caseItem, policyEntry, failures };
};

const collectContextBindingFailures = ({ batch, context, expectedRevision }) => {
  const { corpusResult, experiments, experiment, caseItem, policyEntry } = context;
  if (!experiment || !caseItem || !policyEntry) return [];
  const failures = [];
  const expectedExperimentRef = buildEvolutionPairedExperimentRef({
    manifest: experiments.manifest, experiment,
  });
  const expectedCaseRef = buildEvolutionPairedCaseRef({ corpus: corpusResult.corpus, caseItem });
  if (!sameJson(batch.experimentRef, expectedExperimentRef)) failures.push('paired batch.experimentRef 与当前 manifest 不一致');
  if (!sameJson(batch.caseRef, expectedCaseRef)) failures.push('paired batch.caseRef 与当前 corpus 不一致');
  if (!sameJson(batch.fixtureRef, experiment.fixtureRef)) failures.push('paired batch.fixtureRef 与当前 experiment 不一致');
  if (!sameJson(batch.policyRef, policyEntry.descriptor)) failures.push('paired batch.policyRef 与当前 policy 不一致');
  failures.push(...collectEvolutionPairedAssignmentFailures({ batch, experiment }));
  const assignmentEnvelopeSha256 = hashRegistrationCanaryExactBytes(
    Buffer.from(batch.proof.assignmentEnvelope, 'utf8'),
  );
  if (batch.checkpoint.assignmentEnvelopeSha256 !== assignmentEnvelopeSha256) {
    failures.push('paired batch.checkpoint 未绑定 assignment envelope 精确字节');
  }
  if (batch.rubricSha256 !== hashEvolutionPairedRubric(caseItem)) failures.push('paired batch.rubricSha256 与当前 rubric 不一致');
  if (experiment.caseRef.id !== caseItem.id || experiment.contractVersion !== 2
    || experiment.design?.repetitions !== 3 || experiment.ingestion?.receiptSchemaVersion !== 4) {
    failures.push('paired batch 只能引用当前 3-pair/v4 Skill experiment');
  }
  if (expectedRevision !== undefined && batch.environmentRef.revision !== expectedRevision) {
    failures.push('paired batch.environmentRef.revision 与当前 source-state v2 不一致');
  }
  const expectedPlan = experiment.design?.trialPlan?.map(({ id, pair, arm }, index) => ({
    trialId: id, pair, arm, executionOrdinal: index + 1,
  }));
  const actualPlan = batch.trialResults.map(({ trialId, pair, arm, executionOrdinal }) => ({
    trialId, pair, arm, executionOrdinal,
  }));
  if (!sameJson(actualPlan, expectedPlan)) failures.push('paired batch trial mapping 与固定 experiment plan 不一致');
  return failures;
};

const assessEnvironmentBinding = ({ batch, experiment }) => {
  const binding = experiment?.design?.sharedBindings?.environment;
  if (binding?.status !== 'bound') return { status: 'unavailable', eligible: false };
  if (!isSha256(binding.sha256) || binding.sha256 !== batch.environmentRef.manifestSha256) {
    return { status: 'rejected', eligible: false };
  }
  return { status: 'matched', eligible: true };
};

export const verifyEvolutionPairedBatchArtifact = (input, {
  rootDir,
  expectedRevision,
  maxDate = getLocalIsoDate(),
  pairedTrustPolicy = {},
} = {}) => {
  const batch = normalizedBatch(input);
  const realRoot = fs.realpathSync(rootDir);
  const context = loadPairedContext({ rootDir: realRoot, batch, maxDate });
  const failures = [
    ...context.failures,
    ...collectContextBindingFailures({ batch, context, expectedRevision }),
    ...collectSharedExecutionFailures(batch.trialResults),
  ];
  const trialVerifications = context.caseItem && context.policyEntry
    ? batch.trialResults.map((trial, index) => collectTrialSemanticFailures({
      trial, caseRef: batch.caseRef, policyEntry: context.policyEntry,
      revision: batch.environmentRef.revision, index,
    })) : [];
  failures.push(...trialVerifications.flatMap(item => item.failures));
  if (batch.checkpoint.gradeSetSha256 !== hashEvolutionPairedGradeSet(batch.trialResults)) {
    failures.push('paired batch checkpoint gradeSetSha256 与六条 blind grade refs 不一致');
  }
  const proofVerification = failures.length === 0
    ? verifyEvolutionPairedProofs(batch, pairedTrustPolicy)
    : { status: 'rejected', failures: [], scoringEligible: false };
  if (proofVerification.status === 'rejected') failures.push(...proofVerification.failures);
  const infrastructureEligible = trialVerifications.length === 6
    && trialVerifications.every(item => item.infrastructureReasons.length === 0);
  const environmentBinding = assessEnvironmentBinding({ batch, experiment: context.experiment });
  if (environmentBinding.status === 'rejected') {
    failures.push('paired batch.environmentRef 与 experiment sealed environment binding 不一致');
  }
  const aggregate = aggregateEvolutionPairedCandidateResults(batch.trialResults);
  return {
    batch,
    failures,
    context,
    trialVerifications,
    proofVerification,
    infrastructureEligible,
    environmentBinding,
    aggregate,
    componentEligible: failures.length === 0 && infrastructureEligible && aggregate !== undefined
      && proofVerification.signaturesVerified === true,
    scoringEligible: false,
  };
};

const batchFromReceipt = receipt => ({
  schemaVersion: 1,
  artifactType: 'ai-evolution-paired-trial-batch',
  dataClass: receipt.dataClass,
  experimentRef: receipt.experimentRef,
  caseRef: receipt.caseRef,
  fixtureRef: receipt.fixtureRef,
  environmentRef: receipt.environmentRef,
  policyRef: receipt.policyRef,
  rubricSha256: receipt.rubricSha256,
  assignment: receipt.assignment,
  checkpoint: receipt.checkpoint,
  trialResults: receipt.trialResults,
  proof: receipt.proof,
});

export const verifyEvolutionPairedReceiptV4 = (receipt, options = {}) => {
  let verification;
  try {
    verification = verifyEvolutionPairedBatchArtifact(batchFromReceipt(receipt), {
      ...options, expectedRevision: receipt.revision,
    });
  } catch (error) {
    return {
      failures: [error instanceof Error ? error.message : String(error)],
      proofVerification: { status: 'rejected', failures: [], scoringEligible: false },
      infrastructureEligible: false, aggregate: undefined, scoringEligible: false,
    };
  }
  const { corpusResult, caseItem } = verification.context;
  const expectedValidation = [{
    command: AI_EVOLUTION_PAIRED_VALIDATION_COMMAND,
    status: 'passed', evidence: AI_EVOLUTION_PAIRED_VALIDATION_EVIDENCE,
    checkedAt: receipt.evaluatedAt,
  }];
  const failures = [...verification.failures];
  if (receipt.method !== 'hybrid' || receipt.source !== 'manual'
    || receipt.runner !== AI_EVOLUTION_PAIRED_RUNNER || receipt.aggregation !== 'candidate-only-v1') {
    failures.push('paired receipt v4 method/source/runner/aggregation 非法');
  }
  if (caseItem && (receipt.caseId !== caseItem.id
    || receipt.corpusVersion !== corpusResult.corpus.corpusVersion
    || receipt.caseVersion !== caseItem.caseVersion
    || receipt.subjectVersion !== caseItem.subject.version)) {
    failures.push('paired receipt v4 common case binding 与当前 corpus 不一致');
  }
  if (!sameJson(receipt.validations, expectedValidation)) {
    failures.push('paired receipt v4 validations 必须由固定 verifier 派生');
  }
  return {
    ...verification,
    failures,
    scoringEligible: failures.length === 0 && verification.scoringEligible,
  };
};
