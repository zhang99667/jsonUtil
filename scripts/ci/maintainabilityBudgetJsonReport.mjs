export const hasMaintainabilityBudgetFailures = report => report.failures.length > 0;

export const toMaintainabilityBudgetJsonReport = (
  report,
  { options = {}, totalBudgets = report.summaries.length } = {}
) => {
  const includeAllSummaries = options.printAllSummaries !== false;
  const { failures, summaries, nearLimitSummaries, highUsageSummaries } = report;
  const { usageItems = [], nearLimitItems = [], highUsageItems = [] } = report;
  return {
    ok: !hasMaintainabilityBudgetFailures(report),
    counts: {
      budgets: totalBudgets,
      failures: failures.length,
      summaries: summaries.length,
      printedSummaries: includeAllSummaries ? summaries.length : 0,
      nearLimitSummaries: nearLimitSummaries.length,
      highUsageSummaries: highUsageSummaries.length,
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
    },
  };
};

export const formatMaintainabilityBudgetJsonReport = (report, context) =>
  `${JSON.stringify(toMaintainabilityBudgetJsonReport(report, context), null, 2)}\n`;
