import { governanceAiReportRuntimeMaintainabilityBudgets } from './maintainability-budget-governance-ai-report-runtime-rules.mjs';
import { governanceAiScorecardMaintainabilityBudgets } from './maintainability-budget-governance-ai-scorecard-rules.mjs';

const governanceAiReportBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const governanceAiReportMaintainabilityBudgets = [
  governanceAiReportBudget('scripts/ci/maintainability-budget-governance-ai-report-rules.mjs', 15, 'AI 治理报告预算父表应只组合 report runtime 与 scorecard 子表'),
  ...governanceAiReportRuntimeMaintainabilityBudgets,
  ...governanceAiScorecardMaintainabilityBudgets,
];
