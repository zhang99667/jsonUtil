import { hashEvolutionTraceValue, verifyEvolutionTraceReceipt } from './aiGovernanceEvolutionTrace.mjs';
import { verifyEvolutionTraceProof } from './aiGovernanceEvolutionTraceProof.mjs';
import { verifyRegisteredEvolutionTracePolicy } from './aiGovernanceEvolutionTracePolicies.mjs';
export const verifyEvolutionTraceOutcomes = ({
  outcomes,
  receiptsById,
  casesById,
  policiesByCaseId = new Map(),
  trustedSigners = new Map(),
  pairedTrustPolicy = {},
}) => {
  const traceBoundOutcomeIds = new Set(), verifiedOutcomeIds = new Set(), unverifiedOutcomeIds = new Set();
  const failures = [];
  const verificationByOutcomeId = new Map();
  if (!(trustedSigners instanceof Map)) failures.push('trace trustedSigners 必须是外部传入的 Map');
  for (const outcome of outcomes) {
    const entry = receiptsById.get(outcome.evidence?.receiptId);
    const receipt = entry?.receipt;
    if (outcome.schemaVersion < 2 || ![2, 3, 4].includes(receipt?.schemaVersion)) continue;
    traceBoundOutcomeIds.add(outcome.id);
    if (receipt.schemaVersion === 4) {
      const pairedVerification = entry.pairedVerification;
      const verification = {
        pairedVerification,
        failures: pairedVerification?.failures ?? ['paired receipt v4 缺少验证结果'],
        scoringEligible: pairedVerification?.scoringEligible === true,
      };
      verificationByOutcomeId.set(outcome.id, verification);
      if (verification.failures.length > 0) {
        failures.push(...verification.failures.map(failure => (
          `outcomes.jsonl: outcome \`${outcome.id}\` paired receipt v4 验证失败：${failure}`
        )));
      }
      if (verification.scoringEligible) verifiedOutcomeIds.add(outcome.id);
      else unverifiedOutcomeIds.add(outcome.id);
      continue;
    }
    const caseItem = casesById.get(outcome.caseId);
    if (!caseItem) {
      failures.push(`outcomes.jsonl: outcome \`${outcome.id}\` 的 trace 缺少当前 case`);
      unverifiedOutcomeIds.add(outcome.id);
      continue;
    }
    const policyEntry = policiesByCaseId.get(outcome.caseId);
    const expectedPolicy = policyEntry?.descriptor ?? policyEntry;
    const receiptVerification = verifyEvolutionTraceReceipt(receipt, {
      expectedCaseSha256: hashEvolutionTraceValue(caseItem),
      ...(expectedPolicy ? { expectedPolicy } : {}),
    });
    const policyVerification = verifyRegisteredEvolutionTracePolicy(policyEntry, receipt.trace);
    const proofVerification = receipt.schemaVersion === 3
      ? verifyEvolutionTraceProof(receipt, { trustedSigners })
      : { status: 'unverified', failures: [], signerKeyId: null };
    const proofFacts = proofVerification.statement?.predicate;
    const executionFactsEligible = proofFacts?.cliVersion === '0.144.0-alpha.4'
      && proofFacts.exitCode === 0 && proofFacts.stdoutDrained === true
      && proofFacts.timedOut === false && proofFacts.binaryStable === true;
    const verification = {
      ...receiptVerification,
      policyVerification,
      proofVerification,
      executionFactsEligible,
      scoringEligible: receiptVerification.integrityEligible
        && Object.values(receiptVerification.bindings).every(status => status === 'matched')
        && policyVerification.status === 'verified' && proofVerification.status === 'verified'
        && executionFactsEligible,
    };
    verificationByOutcomeId.set(outcome.id, verification);
    if (verification.failures.length > 0) {
      failures.push(...verification.failures.map(failure => (
        `outcomes.jsonl: outcome \`${outcome.id}\` trace case digest/policy/revision 绑定失败：${failure}`
      )));
    }
    if (policyVerification.status === 'rejected' || policyVerification.status === 'error') {
      failures.push(...policyVerification.failures.map(failure => `outcomes.jsonl: outcome \`${outcome.id}\` trace policy 验证失败：${failure}`));
    }
    if (proofVerification.status === 'rejected' || proofVerification.status === 'error') {
      failures.push(...proofVerification.failures.map(failure => `outcomes.jsonl: outcome \`${outcome.id}\` trace proof 验证失败：${failure}`));
    }
    if (verification.scoringEligible) verifiedOutcomeIds.add(outcome.id);
    else unverifiedOutcomeIds.add(outcome.id);
  }
  const trustedSignerCount = trustedSigners instanceof Map ? trustedSigners.size : 0;
  const pairedVerificationKeyCount = [
    pairedTrustPolicy.assignmentTrustedSigners,
    pairedTrustPolicy.checkpointTrustedSigners,
    pairedTrustPolicy.batchTrustedSigners,
  ].reduce((count, keys) => count + (keys instanceof Map ? keys.size : 0), 0);
  return {
    traceBoundOutcomeIds,
    verifiedOutcomeIds,
    unverifiedOutcomeIds,
    verificationByOutcomeId,
    registry: {
      trustedSigners: trustedSignerCount,
      signatureVerificationKeys: trustedSignerCount + pairedVerificationKeyCount,
      trustedAdapters: trustedSignerCount,
      policies: policiesByCaseId.size,
    },
    failures,
  };
};
