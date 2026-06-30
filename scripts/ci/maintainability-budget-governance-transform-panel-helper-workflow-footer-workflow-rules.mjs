export const governanceTransformPanelHelperWorkflowFooterWorkflowMaintainabilityBudgets = [
  {
    file: 'scripts/ci/maintainability-budget-transform-panel-helper-footer-workflow-rules.mjs',
    maxLines: 15,
    reason: '深度解析 footer workflow 预算入口应只组合 action 与 handler 子表',
  },
  {
    file: 'scripts/ci/maintainability-budget-transform-panel-helper-footer-workflow-action-rules.mjs',
    maxLines: 30,
    reason: '深度解析 footer action 预算规则应独立收口，避免 footer workflow 入口继续贴线',
  },
  {
    file: 'scripts/ci/maintainability-budget-transform-panel-helper-footer-workflow-handler-rules.mjs',
    maxLines: 15,
    reason: '深度解析 footer handler 预算规则应独立收口，避免 footer workflow 入口继续贴线',
  },
];
