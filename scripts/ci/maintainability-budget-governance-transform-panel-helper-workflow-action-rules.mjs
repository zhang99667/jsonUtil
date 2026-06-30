import { governanceTransformPanelHelperWorkflowActionItemMaintainabilityBudgets } from './maintainability-budget-governance-transform-panel-helper-workflow-action-item-rules.mjs';

export const governanceTransformPanelHelperWorkflowActionMaintainabilityBudgets = [
  {
    file: 'scripts/ci/maintainability-budget-transform-panel-helper-action-rules.mjs',
    maxLines: 25,
    reason: '深度解析面板行动项 helper 预算规则应只组合 action item 与 runner 子表',
  },
  {
    file: 'scripts/ci/maintainability-budget-transform-panel-helper-action-runner-rules.mjs',
    maxLines: 20,
    reason: '深度解析行动副作用 runner 预算规则应独立收口，避免 action helper 规则表继续贴线',
  },
  ...governanceTransformPanelHelperWorkflowActionItemMaintainabilityBudgets,
];
