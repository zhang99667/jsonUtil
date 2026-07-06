import { appJsonPathHelperCoreMaintainabilityBudgets } from './maintainability-budget-app-jsonpath-helper-core-rules.mjs';
import { appJsonPathHelperSavedQueryMaintainabilityBudgets } from './maintainability-budget-app-jsonpath-helper-saved-query-rules.mjs';
import { appJsonPathHelperUiMaintainabilityBudgets } from './maintainability-budget-app-jsonpath-helper-ui-rules.mjs';

export const appJsonPathHelperMaintainabilityBudgets = [
  ...appJsonPathHelperCoreMaintainabilityBudgets,
  ...appJsonPathHelperUiMaintainabilityBudgets,
  ...appJsonPathHelperSavedQueryMaintainabilityBudgets,
];
