import { runAiGovernanceEvolutionCases } from './aiGovernanceEvolutionCaseRunner.mjs';
import {
  auditEvolutionWorktreeRevision,
  resolveEvolutionWorktreeRevision,
} from './aiGovernanceEvolutionWorktreeRevision.mjs';

const compactValidation = item => ({ command: item.command, status: item.status });

export const replayEvolutionDeterministicOutcomes = ({
  rootDir,
  outcomes,
  receiptsById,
  runCases = runAiGovernanceEvolutionCases,
  resolveRevision = resolveEvolutionWorktreeRevision,
}) => {
  const deterministicOutcomes = outcomes.filter(outcome => (
    outcome.schemaVersion >= 2 && outcome.provenance?.method === 'deterministic'
    && receiptsById.get(outcome.evidence?.receiptId)?.receipt?.schemaVersion === 1
  ));
  const empty = { verifiedOutcomeIds: new Set(), currentRunVerifiedOutcomeIds: new Set(), failures: [], currentRunIssues: [],
    evidenceFreshness: { status: 'not-applicable', staleOutcomeIds: [], staleCaseIds: [], failures: [] } };
  if (deterministicOutcomes.length === 0) return empty;
  const revision = auditEvolutionWorktreeRevision({
    rootDir, outcomes: deterministicOutcomes, resolveRevision,
  });
  const evidenceFreshness = { status: revision.status, staleOutcomeIds: revision.staleOutcomeIds,
    staleCaseIds: revision.staleCaseIds, failures: revision.issues };
  if (revision.failures.length > 0) return { ...empty, failures: revision.failures, evidenceFreshness };
  let replay;
  try {
    replay = runCases({
      rootDir,
      caseIds: [...new Set(deterministicOutcomes.map(outcome => outcome.caseId))],
    });
  } catch (error) {
    return { ...empty, failures: ['deterministic outcome 即时重放失败：fixed-runner-threw'], currentRunIssues: [{ failureClass: 'infrastructure-invalid', reasonCode: 'fixed-runner-threw',
        diagnostic: 'fixed runner command failed: fixed-runner-threw' }], evidenceFreshness };
  }
  const resultsByCase = new Map(replay.results.map(result => [result.caseId, result]));
  const verifiedOutcomeIds = new Set();
  const currentRunVerifiedOutcomeIds = new Set();
  const staleOutcomeIds = new Set(revision.staleOutcomeIds);
  const failures = [];
  const currentRunIssues = [];
  deterministicOutcomes.forEach((outcome) => {
    const label = `outcomes.jsonl: outcome \`${outcome.id}\``;
    const result = resultsByCase.get(outcome.caseId);
    const receipt = receiptsById.get(outcome.evidence?.receiptId)?.receipt;
    if (!result || !receipt) {
      failures.push(`${label} 缺少可重放 result 或 receipt`);
      currentRunIssues.push({ caseId: outcome.caseId, outcomeId: outcome.id,
        failureClass: 'infrastructure-invalid', reasonCode: 'fixed-replay-binding-missing',
        diagnostic: 'fixed runner replay failed: fixed-replay-binding-missing' });
      return;
    }
    const expectedStatus = outcome.verdict === 'pass' ? 'passed' : 'failed';
    const actualValidations = result.validations?.map(compactValidation) ?? [];
    const receiptValidations = receipt.validations.map(compactValidation);
    const matches = result.caseVersion === outcome.caseVersion
      && result.subjectVersion === outcome.subjectVersion
      && result.status === expectedStatus
      && (outcome.verdict !== 'pass' || result.outcomeEligible === true)
      && JSON.stringify(actualValidations) === JSON.stringify(receiptValidations);
    if (!matches) {
      const failureClass = result.failureClass ?? 'infrastructure-invalid';
      const reasonCode = result.reasonCode ?? 'fixed-replay-result-mismatch';
      failures.push(`${label} 未通过固定 runner 即时重放或 receipt 精确比对 (${failureClass}/${reasonCode})`);
      currentRunIssues.push({ caseId: outcome.caseId, outcomeId: outcome.id, failureClass, reasonCode,
        diagnostic: result.diagnostic ?? `fixed runner replay failed: ${reasonCode}` });
      return;
    }
    (staleOutcomeIds.has(outcome.id) ? currentRunVerifiedOutcomeIds : verifiedOutcomeIds).add(outcome.id);
  });
  return { verifiedOutcomeIds, currentRunVerifiedOutcomeIds, failures, currentRunIssues, evidenceFreshness };
};
