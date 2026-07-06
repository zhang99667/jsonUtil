const governanceAppJsonPathHelperBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const governanceAppJsonPathHelperMaintainabilityBudgets = [
  governanceAppJsonPathHelperBudget('scripts/ci/maintainability-budget-governance-app-jsonpath-helper-rules.mjs', 15, 'JSONPath helper 治理预算规则应维护 helper 预算子表的治理条目'),
  governanceAppJsonPathHelperBudget('scripts/ci/maintainability-budget-app-jsonpath-helper-rules.mjs', 15, 'JSONPath helper 预算入口应只组合 core、query-runner、UI 和 saved-query 子表'),
  governanceAppJsonPathHelperBudget('scripts/ci/maintainability-budget-app-jsonpath-helper-core-rules.mjs', 20, 'JSONPath helper core 预算规则应维护复制、预览、导航、面板引导和 preset 预算'),
  governanceAppJsonPathHelperBudget('scripts/ci/maintainability-budget-app-jsonpath-helper-query-runner-rules.mjs', 15, 'JSONPath helper query-runner 预算规则应维护查询 hook、worker helper、telemetry 和测试夹具预算'),
  governanceAppJsonPathHelperBudget('scripts/ci/maintainability-budget-app-jsonpath-helper-ui-rules.mjs', 15, 'JSONPath helper UI 预算规则应维护 UI 状态、结果状态和标题 helper 预算'),
  governanceAppJsonPathHelperBudget('scripts/ci/maintainability-budget-app-jsonpath-helper-saved-query-rules.mjs', 15, 'JSONPath 保存查询 helper 预算规则应维护 hook、storage sync、action 和 storage 预算'),
];
