import { appJsonPathHelperCoreMaintainabilityBudgets } from './maintainability-budget-app-jsonpath-helper-core-rules.mjs';
import { appJsonPathHelperSavedQueryMaintainabilityBudgets } from './maintainability-budget-app-jsonpath-helper-saved-query-rules.mjs';

export const appJsonPathHelperMaintainabilityBudgets = [
  ...appJsonPathHelperCoreMaintainabilityBudgets,
  ...appJsonPathHelperSavedQueryMaintainabilityBudgets,
];
