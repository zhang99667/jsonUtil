const governanceAppJsonPathComponentTestBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const governanceAppJsonPathComponentTestMaintainabilityBudgets = [
  governanceAppJsonPathComponentTestBudget('scripts/ci/maintainability-budget-app-jsonpath-component-test-rules.mjs', 10, 'JSONPath 组件测试预算入口应只组合 core、result 和 support 子表'),
  governanceAppJsonPathComponentTestBudget('scripts/ci/maintainability-budget-app-jsonpath-component-test-core-rules.mjs', 15, 'JSONPath 核心组件测试预算规则应维护输入区测试条目'),
  governanceAppJsonPathComponentTestBudget('scripts/ci/maintainability-budget-app-jsonpath-component-test-result-rules.mjs', 15, 'JSONPath 结果组件测试预算规则应维护结果预览和工具条测试条目'),
  governanceAppJsonPathComponentTestBudget('scripts/ci/maintainability-budget-app-jsonpath-component-test-support-rules.mjs', 15, 'JSONPath 支撑组件测试预算规则应维护保存查询等辅助组件测试条目'),
];
