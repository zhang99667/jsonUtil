import {
  hashRegistrationCanaryEd25519PublicKey,
  parseRegistrationCanaryDsseEnvelope,
  verifyRegistrationCanaryDsseSignature,
} from './aiGovernanceRegistrationCanaryDsseEnvelope.mjs';
import {
  buildEvolutionPairedAssignmentStatement,
  buildEvolutionPairedBatchStatement,
  buildEvolutionPairedCheckpointStatement,
} from './aiGovernanceEvolutionPairedReceiptV4Commitments.mjs';

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
