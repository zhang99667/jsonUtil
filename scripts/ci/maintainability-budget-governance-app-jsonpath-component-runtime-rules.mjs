const governanceAppJsonPathComponentRuntimeBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const governanceAppJsonPathComponentRuntimeMaintainabilityBudgets = [
  governanceAppJsonPathComponentRuntimeBudget('scripts/ci/maintainability-budget-app-jsonpath-component-rules.mjs', 15, 'JSONPath 组件预算规则应只维护面板和子组件预算'),
  governanceAppJsonPathComponentRuntimeBudget('scripts/ci/maintainability-budget-app-jsonpath-component-runtime-rules.mjs', 15, 'JSONPath 运行时组件预算规则应只组合 panel、result、input 和 support 子表'),
  governanceAppJsonPathComponentRuntimeBudget('scripts/ci/maintainability-budget-app-jsonpath-component-core-rules.mjs', 15, 'JSONPath 核心组件预算规则应只组合 panel 和 result 子表'),
  governanceAppJsonPathComponentRuntimeBudget('scripts/ci/maintainability-budget-app-jsonpath-component-panel-rules.mjs', 10, 'JSONPath 面板组件预算规则应只维护主面板预算'),
  governanceAppJsonPathComponentRuntimeBudget('scripts/ci/maintainability-budget-app-jsonpath-component-result-rules.mjs', 15, 'JSONPath 结果组件预算规则应只组合预览和工具条子表'),
  governanceAppJsonPathComponentRuntimeBudget('scripts/ci/maintainability-budget-app-jsonpath-component-result-preview-rules.mjs', 15, 'JSONPath 结果预览预算规则应只维护预览容器、行和提示预算'),
  governanceAppJsonPathComponentRuntimeBudget('scripts/ci/maintainability-budget-app-jsonpath-component-result-toolbar-rules.mjs', 15, 'JSONPath 结果工具条预算规则应只维护工具条、状态、动作、图标和按钮预算'),
  governanceAppJsonPathComponentRuntimeBudget('scripts/ci/maintainability-budget-app-jsonpath-component-input-rules.mjs', 15, 'JSONPath 输入组件预算规则应只维护查询输入、收藏、动作按钮和状态提示条目'),
  governanceAppJsonPathComponentRuntimeBudget('scripts/ci/maintainability-budget-app-jsonpath-component-support-rules.mjs', 15, 'JSONPath 支撑组件预算规则应只维护保存查询和辅助提示条目'),
];
