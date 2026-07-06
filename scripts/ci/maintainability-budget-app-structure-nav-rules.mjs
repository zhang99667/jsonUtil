import { appStructureNavComponentMaintainabilityBudgets } from './maintainability-budget-app-structure-nav-component-rules.mjs';
import { appStructureNavHelperMaintainabilityBudgets } from './maintainability-budget-app-structure-nav-helper-rules.mjs';
import { appStructureNavTestMaintainabilityBudgets } from './maintainability-budget-app-structure-nav-test-rules.mjs';

export const appStructureNavMaintainabilityBudgets = [
  ...appStructureNavComponentMaintainabilityBudgets,
  ...appStructureNavTestMaintainabilityBudgets,
  ...appStructureNavHelperMaintainabilityBudgets,
];
