const governanceAppJsonPathBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const governanceAppJsonPathMaintainabilityBudgets = [
  governanceAppJsonPathBudget('scripts/ci/maintainability-budget-app-jsonpath-rules.mjs', 15, 'JSONPath 面板预算入口应只组合组件和 helper 子表'),
  governanceAppJsonPathBudget('scripts/ci/maintainability-budget-app-jsonpath-component-rules.mjs', 15, 'JSONPath 组件预算规则应只维护面板和子组件预算'),
  governanceAppJsonPathBudget('scripts/ci/maintainability-budget-app-jsonpath-component-runtime-rules.mjs', 15, 'JSONPath 运行时组件预算规则应只维护面板和子组件预算'),
  governanceAppJsonPathBudget('scripts/ci/maintainability-budget-app-jsonpath-component-core-rules.mjs', 15, 'JSONPath 核心组件预算规则应只维护面板和结果区条目'),
  governanceAppJsonPathBudget('scripts/ci/maintainability-budget-app-jsonpath-component-input-rules.mjs', 15, 'JSONPath 输入组件预算规则应只维护查询输入、收藏、动作按钮和状态提示条目'),
  governanceAppJsonPathBudget('scripts/ci/maintainability-budget-app-jsonpath-component-support-rules.mjs', 15, 'JSONPath 支撑组件预算规则应只维护保存查询和辅助提示条目'),
  governanceAppJsonPathBudget('scripts/ci/maintainability-budget-app-jsonpath-component-test-rules.mjs', 10, 'JSONPath 组件测试预算入口应只组合 core 和 support 子表'),
  governanceAppJsonPathBudget('scripts/ci/maintainability-budget-app-jsonpath-component-test-core-rules.mjs', 15, 'JSONPath 核心组件测试预算规则应维护输入、结果和工具条测试条目'),
  governanceAppJsonPathBudget('scripts/ci/maintainability-budget-app-jsonpath-component-test-support-rules.mjs', 15, 'JSONPath 支撑组件测试预算规则应维护保存查询等辅助组件测试条目'),
  governanceAppJsonPathBudget('scripts/ci/maintainability-budget-app-jsonpath-helper-rules.mjs', 25, 'JSONPath helper 预算规则应维护复制、预览、UI 状态、导航、保存查询、storage 和面板引导预算'),
];
