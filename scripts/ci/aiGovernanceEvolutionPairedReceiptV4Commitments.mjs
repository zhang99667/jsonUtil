import { createHash } from 'node:crypto';

import { hashRegistrationCanaryExactBytes } from './aiGovernanceRegistrationCanaryDsseEnvelope.mjs';

export const AI_EVOLUTION_PAIRED_CHECKPOINT_PREDICATE_TYPE =
  'https://github.com/zhang99667/jsonUtil/attestations/evolution-paired-checkpoint/v1';
export const AI_EVOLUTION_PAIRED_ASSIGNMENT_PREDICATE_TYPE =
  'https://github.com/zhang99667/jsonUtil/attestations/evolution-paired-assignment/v1';
export const AI_EVOLUTION_PAIRED_BATCH_PREDICATE_TYPE =
  'https://github.com/zhang99667/jsonUtil/attestations/evolution-paired-batch/v1';

const STATEMENT_TYPE = 'https://in-toto.io/Statement/v1';
const GRADE_DOMAIN = 'jsonutils.ai-evolution.paired-grade/v1';
const GRADE_SET_DOMAIN = 'jsonutils.ai-evolution.paired-grade-set/v1';
const ASSIGNMENT_DOMAIN = 'jsonutils.ai-evolution.paired-assignment/v1';
const TRIAL_MAP_DOMAIN = 'jsonutils.ai-evolution.paired-trial-map/v1';
const BATCH_BINDING_DOMAIN = 'jsonutils.ai-evolution.paired-batch-binding/v1';

const updateLengthPrefixed = (hash, value) => {
  const bytes = Buffer.isBuffer(value) ? value : Buffer.from(value, 'utf8');
  const length = Buffer.alloc(8);
  length.writeBigUInt64BE(BigInt(bytes.length));
  hash.update(length);
  hash.update(bytes);
};

export const hashEvolutionPairedValue = (domain, value) => {
  const hash = createHash('sha256');
  updateLengthPrefixed(hash, domain);
  updateLengthPrefixed(hash, JSON.stringify(value));
  return hash.digest('hex');
};

const gradeProjection = grade => ({
  status: grade.status,
  verdict: grade.verdict,
  score: grade.score,
  reasonCodes: grade.reasonCodes,
});

export const hashEvolutionPairedGrade = grade => hashEvolutionPairedValue(
  GRADE_DOMAIN,
  gradeProjection(grade),
);

const gradeRefs = trialResults => trialResults
  .map(item => ({
    blindAlias: item.blindAlias,
    resultSha256: item.resultSha256,
    gradeSha256: item.gradeSha256,
  }))
  .sort((left, right) => left.blindAlias.localeCompare(right.blindAlias));

export const hashEvolutionPairedGradeSet = trialResults => hashEvolutionPairedValue(
  GRADE_SET_DOMAIN,
  gradeRefs(trialResults),
);

const sharedBindingProjection = batch => ({
  experimentRef: batch.experimentRef,
  caseRef: batch.caseRef,
  fixtureRef: batch.fixtureRef,
  environmentRef: batch.environmentRef,
  policyRef: batch.policyRef,
  rubricSha256: batch.rubricSha256,
});

const trialMapProjection = trialResults => trialResults.map(item => ({
  trialId: item.trialId,
  pair: item.pair,
  arm: item.arm,
  executionOrdinal: item.executionOrdinal,
  blindAlias: item.blindAlias,
  resultSha256: item.resultSha256,
  gradeSha256: item.gradeSha256,
}));

export const buildEvolutionPairedAssignmentStatement = batch => ({
  _type: STATEMENT_TYPE,
  subject: [{
    name: 'ai-evolution-paired-trial-assignment',
    digest: { sha256: hashEvolutionPairedValue(ASSIGNMENT_DOMAIN, batch.assignment) },
  }],
  predicateType: AI_EVOLUTION_PAIRED_ASSIGNMENT_PREDICATE_TYPE,
  predicate: {
    protocolVersion: '1.0.0',
    role: 'pre-execution-arm-assignment',
    ...sharedBindingProjection(batch),
    assignment: batch.assignment,
  },
});

export const buildEvolutionPairedCheckpointStatement = batch => ({
  _type: STATEMENT_TYPE,
  subject: [{
    name: 'ai-evolution-paired-grade-set',
    digest: { sha256: batch.checkpoint.gradeSetSha256 },
  }],
  predicateType: AI_EVOLUTION_PAIRED_CHECKPOINT_PREDICATE_TYPE,
  predicate: {
    protocolVersion: '1.0.0',
    role: 'pre-unblind-grade-checkpoint',
    ...sharedBindingProjection(batch),
    gradeSet: {
      count: batch.checkpoint.gradeCount,
      sha256: batch.checkpoint.gradeSetSha256,
    },
    assignmentEnvelopeSha256: batch.checkpoint.assignmentEnvelopeSha256,
  },
});

const envelopeSha256 = envelope => hashRegistrationCanaryExactBytes(Buffer.from(envelope, 'utf8'));

const batchBindingProjection = batch => ({
  schemaVersion: batch.schemaVersion,
  artifactType: batch.artifactType,
  dataClass: batch.dataClass,
  ...sharedBindingProjection(batch),
  assignment: batch.assignment,
  checkpoint: batch.checkpoint,
  trialResults: batch.trialResults,
  assignmentEnvelopeSha256: envelopeSha256(batch.proof.assignmentEnvelope),
  checkpointEnvelopeSha256: envelopeSha256(batch.proof.checkpointEnvelope),
});

export const buildEvolutionPairedBatchStatement = batch => ({
  _type: STATEMENT_TYPE,
  subject: [{
    name: 'ai-evolution-paired-trial-batch',
    digest: { sha256: hashEvolutionPairedValue(BATCH_BINDING_DOMAIN, batchBindingProjection(batch)) },
  }],
  predicateType: AI_EVOLUTION_PAIRED_BATCH_PREDICATE_TYPE,
  predicate: {
    protocolVersion: '1.0.0',
    role: 'paired-batch-finalizer',
    ...sharedBindingProjection(batch),
    assignmentEnvelopeSha256: envelopeSha256(batch.proof.assignmentEnvelope),
    checkpointEnvelopeSha256: envelopeSha256(batch.proof.checkpointEnvelope),
    trialMapSha256: hashEvolutionPairedValue(TRIAL_MAP_DOMAIN, trialMapProjection(batch.trialResults)),
  },
});
