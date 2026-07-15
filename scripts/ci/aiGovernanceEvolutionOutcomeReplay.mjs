import { runAiGovernanceEvolutionCases } from './aiGovernanceEvolutionCaseRunner.mjs';
import {
  collectEvolutionWorktreeRevisionFailures,
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
  if (deterministicOutcomes.length === 0) return { verifiedOutcomeIds: new Set(), failures: [] };
  const revisionFailures = collectEvolutionWorktreeRevisionFailures({
    rootDir, outcomes: deterministicOutcomes, resolveRevision,
  });
  if (revisionFailures.length > 0) return { verifiedOutcomeIds: new Set(), failures: revisionFailures };
  let replay;
  try {
    replay = runCases({
      rootDir,
      caseIds: [...new Set(deterministicOutcomes.map(outcome => outcome.caseId))],
    });
  } catch (error) {
    return { verifiedOutcomeIds: new Set(), failures: [`deterministic outcome 即时重放失败：${error.message}`] };
  }
  const resultsByCase = new Map(replay.results.map(result => [result.caseId, result]));
  const verifiedOutcomeIds = new Set();
  const failures = [];
  deterministicOutcomes.forEach((outcome) => {
    const label = `outcomes.jsonl: outcome \`${outcome.id}\``;
    const result = resultsByCase.get(outcome.caseId);
    const receipt = receiptsById.get(outcome.evidence?.receiptId)?.receipt;
    if (!result || !receipt) {
      failures.push(`${label} 缺少可重放 result 或 receipt`);
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
      failures.push(`${label} 未通过固定 runner 即时重放或 receipt 精确比对`);
      return;
    }
    verifiedOutcomeIds.add(outcome.id);
  });
  return { verifiedOutcomeIds, failures };
};
