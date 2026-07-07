const governanceAppStructureNavBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const governanceAppStructureNavMaintainabilityBudgets = [
  governanceAppStructureNavBudget('scripts/ci/maintainability-budget-app-structure-nav-rules.mjs', 15, '结构导航预算入口应只组合组件、测试和 helper 子表'),
  governanceAppStructureNavBudget('scripts/ci/maintainability-budget-app-structure-nav-component-rules.mjs', 20, '结构导航组件预算规则应只维护主面板和拆出的展示组件预算'),
  governanceAppStructureNavBudget('scripts/ci/maintainability-budget-app-structure-nav-test-rules.mjs', 20, '结构导航测试预算规则应只维护结构导航组件测试预算'),
  governanceAppStructureNavBudget('scripts/ci/maintainability-budget-app-structure-nav-helper-rules.mjs', 15, '结构导航 helper 预算规则应只维护展示 helper 预算'),
];
