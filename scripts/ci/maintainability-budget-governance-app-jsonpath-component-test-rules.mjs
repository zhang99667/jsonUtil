const governanceAppJsonPathComponentTestBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const governanceAppJsonPathComponentTestMaintainabilityBudgets = [
  governanceAppJsonPathComponentTestBudget('scripts/ci/maintainability-budget-app-jsonpath-component-test-rules.mjs', 10, 'JSONPath 组件测试预算入口应只组合 core、result 和 support 子表'),
  governanceAppJsonPathComponentTestBudget('scripts/ci/maintainability-budget-app-jsonpath-component-test-core-rules.mjs', 15, 'JSONPath 核心组件测试预算规则应维护输入区测试条目'),
  governanceAppJsonPathComponentTestBudget('scripts/ci/maintainability-budget-app-jsonpath-component-test-result-rules.mjs', 10, 'JSONPath 结果组件测试预算入口应只组合 preview 和 toolbar 子表'),
  governanceAppJsonPathComponentTestBudget('scripts/ci/maintainability-budget-app-jsonpath-component-test-result-preview-rules.mjs', 10, 'JSONPath 结果预览测试预算入口应只组合 core、row 和 support 子表'),
  governanceAppJsonPathComponentTestBudget('scripts/ci/maintainability-budget-app-jsonpath-component-test-result-preview-core-rules.mjs', 10, 'JSONPath 结果预览核心测试预算规则应维护预览容器、列表和提示测试条目'),
  governanceAppJsonPathComponentTestBudget('scripts/ci/maintainability-budget-app-jsonpath-component-test-result-preview-row-rules.mjs', 10, 'JSONPath 结果预览行测试预算规则应维护行、聚焦、内容和定位按钮测试条目'),
  governanceAppJsonPathComponentTestBudget('scripts/ci/maintainability-budget-app-jsonpath-component-test-result-preview-support-rules.mjs', 10, 'JSONPath 结果预览测试支撑预算规则应维护测试数据和夹具条目'),
  governanceAppJsonPathComponentTestBudget('scripts/ci/maintainability-budget-app-jsonpath-component-test-result-toolbar-rules.mjs', 15, 'JSONPath 结果工具条测试预算规则应维护工具条、状态、动作、图标和夹具测试条目'),
  governanceAppJsonPathComponentTestBudget('scripts/ci/maintainability-budget-app-jsonpath-component-test-support-rules.mjs', 15, 'JSONPath 支撑组件测试预算规则应维护保存查询等辅助组件测试条目'),
];
