const governanceAppJsonPathHelperBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const governanceAppJsonPathHelperMaintainabilityBudgets = [
  governanceAppJsonPathHelperBudget('scripts/ci/maintainability-budget-governance-app-jsonpath-helper-rules.mjs', 15, 'JSONPath helper 治理预算规则应维护 helper 预算子表的治理条目'),
  governanceAppJsonPathHelperBudget('scripts/ci/maintainability-budget-app-jsonpath-helper-rules.mjs', 25, 'JSONPath helper 预算规则应维护复制、预览、UI 状态、导航、保存查询、storage 和面板引导预算'),
];
