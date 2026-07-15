export const normalizeJsonutilsEvaluationSummaryLimit = value => (
  Math.min(50, Math.max(1, Number.isInteger(value) ? value : 10))
);

export const buildJsonutilsEvaluationSummaryProjection = ({ report, outcomeSummary, limit }) => {
  const boundedLimit = normalizeJsonutilsEvaluationSummaryLimit(limit);
  return {
    schemaVersion: 3,
    reportType: 'jsonutils-evaluation-summary',
    ok: report.ok,
    counts: report.counts,
    coverage: report.coverage,
    ledgerIntegrity: report.ledgerIntegrity,
    ledgerChain: report.ledgerChain,
    traceVerification: report.traceVerification,
    nextFocus: report.nextFocus,
    contractFailures: report.contractFailures,
    currentRunFailures: report.currentRunFailures,
    currentRunIssues: report.currentRunIssues,
    evidenceFreshness: report.evidenceFreshness,
    graderHealth: report.graderHealth,
    blockedFocus: report.blockedFocus,
    learning: {
      ...report.learning,
      openSignalIds: report.learning.openSignalIds.slice(0, boundedLimit),
      experiments: report.learning.experiments.slice(0, boundedLimit),
      truncated: report.learning.openSignalIds.length > boundedLimit
        || report.learning.experiments.length > boundedLimit,
    },
    recentOutcomes: outcomeSummary.recentOutcomes,
    recentOutcomesScope: 'verified-v2-v3',
    truncated: outcomeSummary.truncated,
  };
};
