import { transformSummaryDecodedMaintainabilityBudgets } from './maintainability-budget-transform-summary-decoded-rules.mjs';
import { transformSummaryCopyMaintainabilityBudgets } from './maintainability-budget-transform-summary-copy-rules.mjs';
import { transformSummaryDiagnosticMaintainabilityBudgets } from './maintainability-budget-transform-summary-diagnostic-rules.mjs';
import { transformSummaryArchiveMaintainabilityBudgets } from './maintainability-budget-transform-summary-archive-rules.mjs';
import { transformSummaryTypesMaintainabilityBudgets } from './maintainability-budget-transform-summary-types-rules.mjs';
import { transformSummaryInsightMaintainabilityBudgets } from './maintainability-budget-transform-summary-insight-rules.mjs';

export const transformSummarySupportMaintainabilityBudgets = [
  ...transformSummaryDecodedMaintainabilityBudgets,
  ...transformSummaryCopyMaintainabilityBudgets,
  ...transformSummaryDiagnosticMaintainabilityBudgets,
  ...transformSummaryArchiveMaintainabilityBudgets,
  ...transformSummaryTypesMaintainabilityBudgets,
  ...transformSummaryInsightMaintainabilityBudgets,
];
