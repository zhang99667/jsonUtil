export const hasMaintainabilityBudgetFailures = report => report.failures.length > 0;

const JSON_REPORT_SCHEMA_VERSION = 1;

export const toMaintainabilityBudgetJsonReport = (
  report,
  { options = {}, totalBudgets = report.summaries.length } = {}
) => {
  const includeAllSummaries = options.printAllSummaries !== false;
  const { failures, summaries, nearLimitSummaries, highUsageSummaries } = report;
  const {
    usageItems = [], nearLimitItems = [], highUsageItems = [], scorecardCandidateItems = [],
    highUsageCandidateCount = highUsageSummaries.length,
  } = report;
  return {
    schemaVersion: JSON_REPORT_SCHEMA_VERSION,
    reportType: 'maintainability-budget',
    ok: !hasMaintainabilityBudgetFailures(report),
    counts: {
      budgets: totalBudgets,
      failures: failures.length,
      summaries: summaries.length,
      printedSummaries: includeAllSummaries ? summaries.length : 0,
      nearLimitSummaries: nearLimitSummaries.length,
      highUsageSummaries: highUsageCandidateCount,
      scorecardCandidates: scorecardCandidateItems.length,
    },
    failures,
    summaries: {
      all: includeAllSummaries ? summaries : [],
      nearLimit: nearLimitSummaries,
      highUsage: highUsageSummaries,
    },
    items: {
      all: includeAllSummaries ? usageItems : [],
      nearLimit: nearLimitItems,
      highUsage: highUsageItems,
      scorecardCandidates: scorecardCandidateItems,
    },
  };
};

export const formatMaintainabilityBudgetJsonReport = (report, context) =>
  `${JSON.stringify(toMaintainabilityBudgetJsonReport(report, context), null, 2)}\n`;
