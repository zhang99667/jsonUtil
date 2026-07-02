import { transformSummaryInsightSchemaCommandMaintainabilityBudgets } from './maintainability-budget-transform-summary-insight-schema-command-rules.mjs';
import { transformSummaryInsightSchemaResourceMaintainabilityBudgets } from './maintainability-budget-transform-summary-insight-schema-resource-rules.mjs';

export const transformSummaryInsightSchemaMaintainabilityBudgets = [
  ...transformSummaryInsightSchemaCommandMaintainabilityBudgets,
  ...transformSummaryInsightSchemaResourceMaintainabilityBudgets,
];
