import { createHash } from 'node:crypto';

import {
  hashRegistrationCanaryEd25519PublicKey,
  hashRegistrationCanaryExactBytes,
  parseRegistrationCanaryDsseEnvelope,
  verifyRegistrationCanaryDsseSignature,
} from './aiGovernanceRegistrationCanaryDsseEnvelope.mjs';

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

const batchBindingProjection = batch => ({
  schemaVersion: batch.schemaVersion,
  artifactType: batch.artifactType,
  dataClass: batch.dataClass,
  ...sharedBindingProjection(batch),
  assignment: batch.assignment,
  checkpoint: batch.checkpoint,
  trialResults: batch.trialResults,
  assignmentEnvelopeSha256: hashRegistrationCanaryExactBytes(
    Buffer.from(batch.proof.assignmentEnvelope, 'utf8'),
  ),
  checkpointEnvelopeSha256: hashRegistrationCanaryExactBytes(
    Buffer.from(batch.proof.checkpointEnvelope, 'utf8'),
  ),
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
    assignmentEnvelopeSha256: hashRegistrationCanaryExactBytes(
      Buffer.from(batch.proof.assignmentEnvelope, 'utf8'),
    ),
    checkpointEnvelopeSha256: hashRegistrationCanaryExactBytes(
      Buffer.from(batch.proof.checkpointEnvelope, 'utf8'),
    ),
    trialMapSha256: hashEvolutionPairedValue(TRIAL_MAP_DOMAIN, trialMapProjection(batch.trialResults)),
  },
});

const verifyEnvelope = ({ envelopeJson, expectedStatement, trustedSigners, label }) => {
  let parsed;
  try {
    parsed = parseRegistrationCanaryDsseEnvelope(envelopeJson, label);
  } catch (error) {
    return {
      status: 'rejected',
      failures: [error instanceof Error ? error.message : String(error)],
      signerKeyId: null,
    };
  }
  if (JSON.stringify(parsed.statement) !== JSON.stringify(expectedStatement)) {
    return {
      status: 'rejected', failures: [`${label} Statement 与当前 batch 绑定不匹配`],
      signerKeyId: parsed.signerKeyId,
    };
  }
  if (!(trustedSigners instanceof Map)) {
    return {
      status: 'rejected', failures: [`${label} trusted signer 必须由外部 Map 注入`],
      signerKeyId: parsed.signerKeyId,
    };
  }
  const publicKey = trustedSigners.get(parsed.signerKeyId);
  if (publicKey === undefined) {
    return {
      status: 'unverified', failures: [], signerKeyId: parsed.signerKeyId,
      proofSha256: parsed.proofSha256,
    };
  }
  try {
    verifyRegistrationCanaryDsseSignature(parsed, publicKey);
    return {
      status: 'verified', failures: [], signerKeyId: parsed.signerKeyId,
      signerSpkiSha256: hashRegistrationCanaryEd25519PublicKey(publicKey),
      proofSha256: parsed.proofSha256,
    };
  } catch (error) {
    return {
      status: 'rejected',
      failures: [error instanceof Error ? error.message : String(error)],
      signerKeyId: parsed.signerKeyId,
    };
  }
};

export const verifyEvolutionPairedProofs = (batch, {
  assignmentTrustedSigners = new Map(),
  checkpointTrustedSigners = new Map(),
  batchTrustedSigners = new Map(),
} = {}) => {
  const assignment = verifyEnvelope({
    envelopeJson: batch.proof.assignmentEnvelope,
    expectedStatement: buildEvolutionPairedAssignmentStatement(batch),
    trustedSigners: assignmentTrustedSigners,
    label: 'paired assignment proof',
  });
  const checkpoint = verifyEnvelope({
    envelopeJson: batch.proof.checkpointEnvelope,
    expectedStatement: buildEvolutionPairedCheckpointStatement(batch),
    trustedSigners: checkpointTrustedSigners,
    label: 'paired checkpoint proof',
  });
  const finalBatch = verifyEnvelope({
    envelopeJson: batch.proof.batchEnvelope,
    expectedStatement: buildEvolutionPairedBatchStatement(batch),
    trustedSigners: batchTrustedSigners,
    label: 'paired batch proof',
  });
  const roles = [assignment, checkpoint, finalBatch];
  const failures = roles.flatMap(item => item.failures);
  for (let left = 0; left < roles.length; left += 1) {
    for (let right = left + 1; right < roles.length; right += 1) {
      if (roles[left].signerKeyId && roles[left].signerKeyId === roles[right].signerKeyId) {
        failures.push('paired assignment/checkpoint/batch proof 必须使用不同 keyid');
      }
      if (roles[left].signerSpkiSha256
        && roles[left].signerSpkiSha256 === roles[right].signerSpkiSha256) {
        failures.push('paired assignment/checkpoint/batch proof 必须使用不同 Ed25519 SPKI');
      }
    }
  }
  const signaturesVerified = roles.every(item => item.status === 'verified');
  const status = failures.length > 0 || roles.some(item => item.status === 'rejected')
    ? 'rejected'
    : signaturesVerified ? 'signature-verified-unwitnessed' : 'unverified';
  return {
    status,
    failures,
    assignment,
    checkpoint,
    batch: finalBatch,
    signaturesVerified,
    trustPolicyProtected: false,
    scoringEligible: false,
  };
};
