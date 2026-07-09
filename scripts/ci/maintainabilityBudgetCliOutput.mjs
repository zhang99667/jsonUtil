import {
  formatMaintainabilityBudgetJsonReport,
  hasMaintainabilityBudgetFailures,
} from './maintainabilityBudgetJsonReport.mjs';

export { formatMaintainabilityBudgetJsonReport, hasMaintainabilityBudgetFailures };

export const printMaintainabilityBudgetHumanReport = (
  { failures, summaries, nearLimitSummaries, highUsageSummaries },
  { options = {}, totalBudgets },
  output = console
) => {
  if (failures.length > 0) {
    output.error('可维护性预算检查失败:');
    failures.forEach(failure => output.error(`- ${failure}`));
    return;
  }

  output.log(`可维护性预算检查通过，共 ${totalBudgets} 个文件。`);
  if (nearLimitSummaries.length > 0) {
    output.log(`接近预算上限 ${nearLimitSummaries.length} 个文件（剩余 ≤5 行或使用率 ≥90%）：`);
    nearLimitSummaries.forEach(summary => output.log(`! ${summary}`));
  }
  if (highUsageSummaries.length > 0) {
    output.log(`高使用率候选 ${highUsageSummaries.length} 个：`);
    highUsageSummaries.forEach(summary => output.log(`> ${summary}`));
  }
  if (options.printAllSummaries !== false) {
    summaries.forEach(summary => output.log(`- ${summary}`));
  }
};
