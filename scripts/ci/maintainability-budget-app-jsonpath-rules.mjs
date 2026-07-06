import { appJsonPathComponentMaintainabilityBudgets } from './maintainability-budget-app-jsonpath-component-rules.mjs';
import { appJsonPathHelperMaintainabilityBudgets } from './maintainability-budget-app-jsonpath-helper-rules.mjs';

export const appJsonPathMaintainabilityBudgets = [
  ...appJsonPathComponentMaintainabilityBudgets,
  ...appJsonPathHelperMaintainabilityBudgets,
];
