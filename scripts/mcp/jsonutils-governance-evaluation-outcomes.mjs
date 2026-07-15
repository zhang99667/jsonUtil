const validationCounts = outcome => (outcome.writeback?.validationResults ?? []).reduce(
  (counts, result) => ({ ...counts, [result.status]: (counts[result.status] ?? 0) + 1 }),
  { passed: 0, failed: 0 },
);

export const buildRecentScoredOutcomeSummary = ({
  outcomes,
  scoredOutcomeIds,
  fixedReplayOutcomeIds = new Set(),
  traceVerifiedOutcomeIds = new Set(),
  limit,
}) => {
  const verifiedIds = new Set([...fixedReplayOutcomeIds, ...traceVerifiedOutcomeIds]);
  const scored = outcomes.filter(outcome => (
    outcome.schemaVersion >= 2 && scoredOutcomeIds.has(outcome.id) && verifiedIds.has(outcome.id)
  ));
  const recentOutcomes = scored.slice(-limit).reverse().map(outcome => ({
    schemaVersion: outcome.schemaVersion,
    scoringStatus: 'verified',
    verificationMethod: traceVerifiedOutcomeIds.has(outcome.id) ? 'agent-trace' : 'fixed-replay',
    id: outcome.id,
    caseId: outcome.caseId,
    corpusVersion: outcome.corpusVersion,
    caseVersion: outcome.caseVersion,
    subjectVersion: outcome.subjectVersion,
    evaluatedAt: outcome.evaluatedAt,
    verdict: outcome.verdict,
    score: outcome.score,
    provenance: {
      method: outcome.provenance.method,
      source: outcome.provenance.source,
      trials: outcome.provenance.trials,
    },
    validation: validationCounts(outcome),
    ...(outcome.schemaVersion === 3 ? {
      ledgerSequence: outcome.chain.sequence,
      previousOutcomeId: outcome.supersession.previousOutcomeId,
      feedbackDisposition: outcome.supersession.feedbackDisposition,
    } : {}),
  }));
  return { recentOutcomes, truncated: scored.length > recentOutcomes.length };
};
