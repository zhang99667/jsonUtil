import { governanceTransformPanelSectionDomainMaintainabilityBudgets } from './maintainability-budget-governance-transform-panel-section-domain-rules.mjs';

export const governanceTransformPanelSectionMaintainabilityBudgets = [
  ...governanceTransformPanelSectionDomainMaintainabilityBudgets,
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
