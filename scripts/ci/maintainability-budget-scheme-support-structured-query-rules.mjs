import { schemeSupportStructuredQueryAssignMaintainabilityBudgets } from './maintainability-budget-scheme-support-structured-query-assign-rules.mjs';
import { schemeSupportStructuredQueryParseMaintainabilityBudgets } from './maintainability-budget-scheme-support-structured-query-parse-rules.mjs';
import { schemeSupportStructuredQuerySerializeMaintainabilityBudgets } from './maintainability-budget-scheme-support-structured-query-serialize-rules.mjs';

export const schemeSupportStructuredQueryMaintainabilityBudgets = [
  ...schemeSupportStructuredQueryParseMaintainabilityBudgets,
  ...schemeSupportStructuredQueryAssignMaintainabilityBudgets,
  ...schemeSupportStructuredQuerySerializeMaintainabilityBudgets,
];
