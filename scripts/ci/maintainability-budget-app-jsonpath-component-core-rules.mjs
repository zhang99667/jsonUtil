import { appJsonPathComponentPanelMaintainabilityBudgets } from './maintainability-budget-app-jsonpath-component-panel-rules.mjs';
import { appJsonPathComponentResultMaintainabilityBudgets } from './maintainability-budget-app-jsonpath-component-result-rules.mjs';

export const appJsonPathComponentCoreMaintainabilityBudgets = [
  ...appJsonPathComponentPanelMaintainabilityBudgets,
  ...appJsonPathComponentResultMaintainabilityBudgets,
];
