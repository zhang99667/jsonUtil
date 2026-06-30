export const governanceTransformPanelHelperWorkflowActionItemMaintainabilityBudgets = [
  {
    file: 'scripts/ci/maintainability-budget-transform-panel-helper-action-item-rules.mjs',
    maxLines: 15,
    reason: '深度解析行动项预算入口应只组合 builder 与 contract 子表',
  },
  {
    file: 'scripts/ci/maintainability-budget-transform-panel-helper-action-item-builder-rules.mjs',
    maxLines: 20,
    reason: '深度解析行动项 builder 预算规则应独立收口，避免行动项入口继续贴线',
  },
  {
    file: 'scripts/ci/maintainability-budget-transform-panel-helper-action-item-contract-rules.mjs',
    maxLines: 25,
    reason: '深度解析行动项类型、兼容入口和静态配置预算规则应独立收口',
  },
];
