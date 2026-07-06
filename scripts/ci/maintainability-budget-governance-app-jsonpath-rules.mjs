import { governanceAppJsonPathComponentMaintainabilityBudgets } from './maintainability-budget-governance-app-jsonpath-component-rules.mjs';
import { governanceAppJsonPathHelperMaintainabilityBudgets } from './maintainability-budget-governance-app-jsonpath-helper-rules.mjs';

const governanceAppJsonPathBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const governanceAppJsonPathMaintainabilityBudgets = [
  governanceAppJsonPathBudget('scripts/ci/maintainability-budget-app-jsonpath-rules.mjs', 15, 'JSONPath 面板预算入口应只组合组件和 helper 子表'),
  ...governanceAppJsonPathComponentMaintainabilityBudgets,
  ...governanceAppJsonPathHelperMaintainabilityBudgets,
];
