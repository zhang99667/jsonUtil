import { governanceAppJsonPathComponentRuntimeMaintainabilityBudgets } from './maintainability-budget-governance-app-jsonpath-component-runtime-rules.mjs';
import { governanceAppJsonPathComponentTestMaintainabilityBudgets } from './maintainability-budget-governance-app-jsonpath-component-test-rules.mjs';

const governanceAppJsonPathComponentBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const governanceAppJsonPathComponentMaintainabilityBudgets = [
  governanceAppJsonPathComponentBudget('scripts/ci/maintainability-budget-governance-app-jsonpath-component-rules.mjs', 15, 'JSONPath 组件治理预算入口应只组合 runtime 和 test 治理子表'),
  governanceAppJsonPathComponentBudget('scripts/ci/maintainability-budget-governance-app-jsonpath-component-runtime-rules.mjs', 20, 'JSONPath 运行时组件治理预算规则应维护运行时组件预算子表'),
  governanceAppJsonPathComponentBudget('scripts/ci/maintainability-budget-governance-app-jsonpath-component-test-rules.mjs', 15, 'JSONPath 组件测试治理预算规则应维护测试预算子表'),
  ...governanceAppJsonPathComponentRuntimeMaintainabilityBudgets,
  ...governanceAppJsonPathComponentTestMaintainabilityBudgets,
];
