const stateGovernanceBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const governanceAppWorkflowStateMaintainabilityBudgets = [
  stateGovernanceBudget('scripts/ci/maintainability-budget-app-workflow-state-rules.mjs', 30, 'App 状态派生预算规则应保持短表，新增状态 helper 先按异步/编辑区分层'),
  stateGovernanceBudget('scripts/ci/maintainability-budget-app-workflow-state-core-rules.mjs', 20, 'App 状态核心预算规则应只组合异步状态和 UI 状态子表'),
  stateGovernanceBudget('scripts/ci/maintainability-budget-app-workflow-state-async-rules.mjs', 15, 'App 异步状态预算规则应只维护异步策略和异步转换状态 helper'),
  stateGovernanceBudget('scripts/ci/maintainability-budget-app-workflow-state-ui-rules.mjs', 15, 'App UI 状态预算规则应只维护编辑区派生状态和懒加载 panel 状态 helper'),
  stateGovernanceBudget('scripts/ci/maintainability-budget-app-workflow-state-helper-rules.mjs', 25, 'App 状态 helper 预算规则应承接 PREVIEW 同步和懒加载 loaded 等专用 hook/helper'),
];
