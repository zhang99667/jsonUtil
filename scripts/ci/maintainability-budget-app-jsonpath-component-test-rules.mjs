import { appJsonPathComponentTestCoreMaintainabilityBudgets } from './maintainability-budget-app-jsonpath-component-test-core-rules.mjs';
import { appJsonPathComponentTestResultMaintainabilityBudgets } from './maintainability-budget-app-jsonpath-component-test-result-rules.mjs';
import { appJsonPathComponentTestSupportMaintainabilityBudgets } from './maintainability-budget-app-jsonpath-component-test-support-rules.mjs';

export const appJsonPathComponentTestMaintainabilityBudgets = [
  ...appJsonPathComponentTestCoreMaintainabilityBudgets,
  ...appJsonPathComponentTestResultMaintainabilityBudgets,
  ...appJsonPathComponentTestSupportMaintainabilityBudgets,
];
