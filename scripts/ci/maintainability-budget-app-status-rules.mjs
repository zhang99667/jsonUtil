import { appStatusComponentMaintainabilityBudgets } from './maintainability-budget-app-status-component-rules.mjs';
import { appStatusHelperMaintainabilityBudgets } from './maintainability-budget-app-status-helper-rules.mjs';

export const appStatusMaintainabilityBudgets = [
  ...appStatusComponentMaintainabilityBudgets,
  ...appStatusHelperMaintainabilityBudgets,
];
