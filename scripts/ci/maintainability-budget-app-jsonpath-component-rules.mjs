import { appJsonPathComponentRuntimeMaintainabilityBudgets } from './maintainability-budget-app-jsonpath-component-runtime-rules.mjs';
import { appJsonPathComponentTestMaintainabilityBudgets } from './maintainability-budget-app-jsonpath-component-test-rules.mjs';

export const appJsonPathComponentMaintainabilityBudgets = [
  ...appJsonPathComponentRuntimeMaintainabilityBudgets,
  ...appJsonPathComponentTestMaintainabilityBudgets,
];
