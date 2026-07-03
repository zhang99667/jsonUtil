const stateGovernanceBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const governanceAppWorkflowStateMaintainabilityBudgets = [
  stateGovernanceBudget('scripts/ci/maintainability-budget-app-workflow-state-rules.mjs', 30, 'App 状态派生预算规则应保持短表，新增状态 helper 先按异步/编辑区分层'),
  stateGovernanceBudget('scripts/ci/maintainability-budget-app-workflow-state-core-rules.mjs', 20, 'App 状态核心预算规则应只组合异步状态和 UI 状态子表'),
  stateGovernanceBudget('scripts/ci/maintainability-budget-app-workflow-state-async-rules.mjs', 15, 'App 异步状态预算规则应只维护异步策略和异步转换状态 helper'),
  stateGovernanceBudget('scripts/ci/maintainability-budget-app-workflow-state-ui-rules.mjs', 15, 'App UI 状态预算规则应只维护编辑区派生状态和懒加载 panel 状态 helper'),
  stateGovernanceBudget('scripts/ci/maintainability-budget-app-workflow-state-helper-rules.mjs', 20, 'App 状态 helper 预算规则应承接懒加载 loaded 等专用 hook/helper'),
  stateGovernanceBudget('scripts/ci/maintainability-budget-app-workflow-state-preview-sync-rules.mjs', 15, 'App PREVIEW 同步预算入口应只组合 hooks 和 utils 两张子表'),
  stateGovernanceBudget('scripts/ci/maintainability-budget-app-workflow-state-preview-sync-hooks-rules.mjs', 15, 'App PREVIEW 同步 hooks 预算入口应只组合运行时和测试子表'),
  stateGovernanceBudget('scripts/ci/maintainability-budget-app-workflow-state-preview-sync-hooks-runtime-rules.mjs', 15, 'App PREVIEW 同步 hooks 运行时预算规则应维护 hook 与 scheduler 预算'),
  stateGovernanceBudget('scripts/ci/maintainability-budget-app-workflow-state-preview-sync-hooks-test-rules.mjs', 20, 'App PREVIEW 同步 hooks 测试预算规则应维护行为测试与夹具预算'),
  stateGovernanceBudget('scripts/ci/maintainability-budget-app-workflow-state-preview-sync-utils-rules.mjs', 15, 'App PREVIEW 同步 utils 预算入口应只组合运行时和测试子表'),
  stateGovernanceBudget('scripts/ci/maintainability-budget-app-workflow-state-preview-sync-utils-runtime-rules.mjs', 15, 'App PREVIEW 同步 utils 运行时预算规则应维护 request、task、runner 和 result helper 预算'),
  stateGovernanceBudget('scripts/ci/maintainability-budget-app-workflow-state-preview-sync-utils-test-rules.mjs', 15, 'App PREVIEW 同步 utils 测试预算规则应维护 request、task、runner 和 result 测试预算'),
];
