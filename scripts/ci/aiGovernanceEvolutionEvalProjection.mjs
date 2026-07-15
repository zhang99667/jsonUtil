import { countEvolutionCurrentRunIssues } from './aiGovernanceEvolutionCaseFailure.mjs';
import { buildEvolutionNextFocus, countEvolutionVerdicts } from './aiGovernanceEvolutionEvalFocus.mjs';

export const buildEvolutionEvalProjection = ({
  corpusResult,
  behaviorCaseIds,
  componentBoundaryCaseIds,
  receiptResult,
  outcomeResult,
  history,
  replay,
  currentRunFailures,
  currentRunIssues,
  traceVerification,
  policyRegistry,
  contractFailures,
  ledgerIntegrity,
}) => {
  const failures = [...contractFailures, ...currentRunFailures];
  const currentRunClassCounts = countEvolutionCurrentRunIssues(currentRunIssues);
  const currentRunVerifiedOutcomeIds = replay.currentRunVerifiedOutcomeIds ?? new Set();
  const evidenceFreshness = replay.evidenceFreshness
    ?? { status: 'current', staleOutcomeIds: [], staleCaseIds: [], failures: [] };
  const verifiedOutcomeIds = new Set([...replay.verifiedOutcomeIds, ...traceVerification.verifiedOutcomeIds]);
  const activeOutcomes = history.activeLatestOutcomes.filter(outcome => verifiedOutcomeIds.has(outcome.id));
  const unverifiedOutcomeIds = new Set([
    ...traceVerification.unverifiedOutcomeIds,
    ...history.activeLatestOutcomes.filter(outcome => outcome.schemaVersion >= 2
      && outcome.provenance?.method !== 'deterministic' && !verifiedOutcomeIds.has(outcome.id)).map(outcome => outcome.id),
  ]);
  const unverifiedOutcomes = history.activeLatestOutcomes.filter(outcome => unverifiedOutcomeIds.has(outcome.id));
  const traceBoundUnverifiedOutcomes = history.activeLatestOutcomes
    .filter(outcome => traceVerification.unverifiedOutcomeIds.has(outcome.id));
  const coveredCaseIds = new Set(activeOutcomes.map(item => item.caseId).filter(id => behaviorCaseIds.has(id)));
  const uncoveredCaseIds = [...behaviorCaseIds].filter(id => !coveredCaseIds.has(id));
  const counts = {
    cases: corpusResult.cases.length,
    behaviorCases: behaviorCaseIds.size,
    componentBoundaryCases: componentBoundaryCaseIds.length,
    outcomes: activeOutcomes.length,
    totalOutcomes: outcomeResult.outcomes.length,
    validOutcomes: outcomeResult.validOutcomes.length,
    activeLatestOutcomes: activeOutcomes.length,
    recordedActiveOutcomes: history.activeLatestOutcomes.length,
    fixedReplayVerifiedOutcomes: replay.verifiedOutcomeIds.size,
    currentRunVerifiedOutcomes: currentRunVerifiedOutcomeIds.size,
    evidenceFreshnessFailures: evidenceFreshness.failures.length,
    traceBoundOutcomes: traceVerification.traceBoundOutcomeIds.size,
    traceVerifiedOutcomes: traceVerification.verifiedOutcomeIds.size,
    traceBoundUnverifiedOutcomes: traceVerification.unverifiedOutcomeIds.size,
    unverifiedOutcomes: unverifiedOutcomes.length,
    legacyOutcomes: history.legacyOutcomes.length,
    staleOutcomes: history.staleOutcomes.length,
    retiredOutcomes: history.retiredOutcomes.length,
    supersededOutcomes: history.supersededOutcomes,
    historyOutcomes: outcomeResult.validOutcomes.length - activeOutcomes.length,
    invalidOutcomes: outcomeResult.invalidOutcomeCount + history.invalidOutcomes,
    trialReceipts: receiptResult.receipts.length,
    validTrialReceipts: receiptResult.validReceipts.length,
    invalidTrialReceipts: receiptResult.invalidReceiptCount,
    chainedOutcomes: outcomeResult.ledgerChain.chainedOutcomes,
    openFeedback: outcomeResult.ledgerChain.openFeedback,
    resolvedFeedback: outcomeResult.ledgerChain.resolvedFeedback,
    pass: countEvolutionVerdicts(activeOutcomes, 'pass'),
    partial: countEvolutionVerdicts(activeOutcomes, 'partial'),
    fail: countEvolutionVerdicts(activeOutcomes, 'fail'),
    unverifiedPass: countEvolutionVerdicts(unverifiedOutcomes, 'pass'),
    unverifiedPartial: countEvolutionVerdicts(unverifiedOutcomes, 'partial'),
    unverifiedFail: countEvolutionVerdicts(unverifiedOutcomes, 'fail'),
    coveredCases: coveredCaseIds.size,
    uncoveredCases: uncoveredCaseIds.length,
    failures: failures.length,
    ...currentRunClassCounts,
  };
  const coverage = {
    corpus: corpusResult.coverage,
    outcomes: {
      coveredCases: coveredCaseIds.size,
      totalCases: behaviorCaseIds.size,
      percent: behaviorCaseIds.size === 0 ? 0 : Math.round((coveredCaseIds.size / behaviorCaseIds.size) * 100),
      uncoveredCaseIds,
      excluded: {
        coverageClass: 'component-boundary',
        totalCases: componentBoundaryCaseIds.length,
        caseIds: componentBoundaryCaseIds,
      },
      activeLatestOutcomes: activeOutcomes.length,
      staleOutcomes: history.staleOutcomes.length,
      retiredOutcomes: history.retiredOutcomes.length,
    },
  };
  return {
    schemaVersion: 3,
    reportType: 'ai-governance-evolution-evals',
    ok: failures.length === 0 && evidenceFreshness.failures.length === 0,
    counts,
    coverage,
    failures,
    contractFailures,
    currentRunFailures,
    currentRunIssues,
    evidenceFreshness,
    ledgerIntegrity,
    ledgerChain: outcomeResult.ledgerChain,
    traceVerification: {
      status: traceVerification.registry.trustedSigners > 0 && traceVerification.registry.policies > 0
        ? 'configured'
        : traceVerification.registry.policies > 0 ? 'policy-ready' : 'unavailable',
      ...traceVerification.registry,
      policyCaseIds: [...policyRegistry.policiesByCaseId.keys()].filter(id => behaviorCaseIds.has(id)),
    },
    nextFocus: buildEvolutionNextFocus({
      contractFailures,
      currentRunFailures,
      currentRunIssues,
      evidenceFreshness,
      currentRunVerifiedCaseIds: evidenceFreshness.staleCaseIds,
      outcomes: activeOutcomes,
      unverifiedOutcomes,
      traceBoundUnverifiedOutcomes,
      uncoveredCaseIds,
      tracePolicyCaseIds: [...policyRegistry.policiesByCaseId.keys()].filter(id => behaviorCaseIds.has(id)),
      ledgerChain: outcomeResult.ledgerChain,
    }),
    scoredOutcomeIds: activeOutcomes.map(outcome => outcome.id),
    fixedReplayVerifiedOutcomeIds: [...replay.verifiedOutcomeIds],
    currentRunVerifiedOutcomeIds: [...currentRunVerifiedOutcomeIds],
    traceVerifiedOutcomeIds: [...traceVerification.verifiedOutcomeIds],
    traceBoundOutcomeIds: [...traceVerification.traceBoundOutcomeIds],
    unverifiedOutcomeIds: unverifiedOutcomes.map(outcome => outcome.id),
  };
};
