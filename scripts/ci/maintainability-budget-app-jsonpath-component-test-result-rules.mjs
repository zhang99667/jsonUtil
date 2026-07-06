import { appJsonPathComponentTestResultPreviewMaintainabilityBudgets } from './maintainability-budget-app-jsonpath-component-test-result-preview-rules.mjs';
import { appJsonPathComponentTestResultToolbarMaintainabilityBudgets } from './maintainability-budget-app-jsonpath-component-test-result-toolbar-rules.mjs';

export const appJsonPathComponentTestResultMaintainabilityBudgets = [
  ...appJsonPathComponentTestResultPreviewMaintainabilityBudgets,
  ...appJsonPathComponentTestResultToolbarMaintainabilityBudgets,
];
