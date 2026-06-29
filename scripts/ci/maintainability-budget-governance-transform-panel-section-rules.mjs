export const governanceTransformPanelSectionMaintainabilityBudgets = [
  {
    file: 'scripts/ci/maintainability-budget-transform-panel-section-rules.mjs',
    maxLines: 40,
    reason: '深度解析面板 section 预算规则应保持短表，占位符区域独立收口到 placeholder-section 子表',
  },
  {
    file: 'scripts/ci/maintainability-budget-transform-panel-section-small-rules.mjs',
    maxLines: 30,
    reason: '深度解析面板小型 section 预算规则应保持短表，新增小组件需说明复用边界',
  },
  {
    file: 'scripts/ci/maintainability-budget-transform-panel-placeholder-section-rules.mjs',
    maxLines: 25,
    reason: '深度解析运行时占位符预算规则应独立收口，避免 section 规则表回涨',
  },
];
