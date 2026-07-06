import { appJsonPathComponentResultPreviewMaintainabilityBudgets } from './maintainability-budget-app-jsonpath-component-result-preview-rules.mjs';
import { appJsonPathComponentResultToolbarMaintainabilityBudgets } from './maintainability-budget-app-jsonpath-component-result-toolbar-rules.mjs';

export const appJsonPathComponentResultMaintainabilityBudgets = [
  ...appJsonPathComponentResultPreviewMaintainabilityBudgets,
  ...appJsonPathComponentResultToolbarMaintainabilityBudgets,
];
