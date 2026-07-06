import { appJsonPathComponentCoreMaintainabilityBudgets } from './maintainability-budget-app-jsonpath-component-core-rules.mjs';
import { appJsonPathComponentInputMaintainabilityBudgets } from './maintainability-budget-app-jsonpath-component-input-rules.mjs';
import { appJsonPathComponentSupportMaintainabilityBudgets } from './maintainability-budget-app-jsonpath-component-support-rules.mjs';

export const appJsonPathComponentRuntimeMaintainabilityBudgets = [
  ...appJsonPathComponentCoreMaintainabilityBudgets,
  ...appJsonPathComponentInputMaintainabilityBudgets,
  ...appJsonPathComponentSupportMaintainabilityBudgets,
];
