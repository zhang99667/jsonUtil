import { appJsonPathHelperCoreMaintainabilityBudgets } from './maintainability-budget-app-jsonpath-helper-core-rules.mjs';
import { appJsonPathHelperQueryRunnerMaintainabilityBudgets } from './maintainability-budget-app-jsonpath-helper-query-runner-rules.mjs';
import { appJsonPathHelperSavedQueryMaintainabilityBudgets } from './maintainability-budget-app-jsonpath-helper-saved-query-rules.mjs';
import { appJsonPathHelperUiMaintainabilityBudgets } from './maintainability-budget-app-jsonpath-helper-ui-rules.mjs';

export const appJsonPathHelperMaintainabilityBudgets = [
  ...appJsonPathHelperCoreMaintainabilityBudgets,
  ...appJsonPathHelperQueryRunnerMaintainabilityBudgets,
  ...appJsonPathHelperUiMaintainabilityBudgets,
  ...appJsonPathHelperSavedQueryMaintainabilityBudgets,
];
