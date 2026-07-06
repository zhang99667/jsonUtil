import { appJsonPathComponentTestResultPreviewCoreMaintainabilityBudgets } from './maintainability-budget-app-jsonpath-component-test-result-preview-core-rules.mjs';
import { appJsonPathComponentTestResultPreviewRowMaintainabilityBudgets } from './maintainability-budget-app-jsonpath-component-test-result-preview-row-rules.mjs';
import { appJsonPathComponentTestResultPreviewSupportMaintainabilityBudgets } from './maintainability-budget-app-jsonpath-component-test-result-preview-support-rules.mjs';

export const appJsonPathComponentTestResultPreviewMaintainabilityBudgets = [
  ...appJsonPathComponentTestResultPreviewCoreMaintainabilityBudgets,
  ...appJsonPathComponentTestResultPreviewRowMaintainabilityBudgets,
  ...appJsonPathComponentTestResultPreviewSupportMaintainabilityBudgets,
];
