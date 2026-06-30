export const governanceTransformPanelHelperWorkflowFooterMaintainabilityBudgets = [
  {
    file: 'scripts/ci/maintainability-budget-transform-panel-helper-footer-rules.mjs',
    maxLines: 25,
    reason: '深度解析 footer helper 预算规则应只组合 workflow 与 contract 子表',
  },
  {
    file: 'scripts/ci/maintainability-budget-transform-panel-helper-footer-workflow-rules.mjs',
    maxLines: 30,
    reason: '深度解析 footer 操作生成和副作用预算规则应独立收口，避免 footer helper 规则表继续贴线',
  },
  {
    file: 'scripts/ci/maintainability-budget-transform-panel-helper-footer-contract-rules.mjs',
    maxLines: 20,
    reason: '深度解析 footer 类型和配置预算规则应独立收口，避免 footer helper 规则表继续贴线',
  },
];
