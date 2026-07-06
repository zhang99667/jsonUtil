import { appJsonPathComponentTestCoreMaintainabilityBudgets } from './maintainability-budget-app-jsonpath-component-test-core-rules.mjs';
import { appJsonPathComponentTestSupportMaintainabilityBudgets } from './maintainability-budget-app-jsonpath-component-test-support-rules.mjs';

export const appJsonPathComponentTestMaintainabilityBudgets = [
  ...appJsonPathComponentTestCoreMaintainabilityBudgets,
  ...appJsonPathComponentTestSupportMaintainabilityBudgets,
];
