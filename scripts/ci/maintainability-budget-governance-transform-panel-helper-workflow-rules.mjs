import { governanceTransformPanelHelperWorkflowActionMaintainabilityBudgets } from './maintainability-budget-governance-transform-panel-helper-workflow-action-rules.mjs';
import { governanceTransformPanelHelperWorkflowFooterMaintainabilityBudgets } from './maintainability-budget-governance-transform-panel-helper-workflow-footer-rules.mjs';

export const governanceTransformPanelHelperWorkflowMaintainabilityBudgets = [
  {
    file: 'scripts/ci/maintainability-budget-governance-transform-panel-helper-workflow-action-rules.mjs',
    maxLines: 30,
    reason: '深度解析 action helper 治理规则应独立收口，避免 workflow 治理入口继续贴线',
  },
  {
    file: 'scripts/ci/maintainability-budget-governance-transform-panel-helper-workflow-action-item-rules.mjs',
    maxLines: 30,
    reason: '深度解析行动项治理规则应独立收口，避免 action 治理表继续贴线',
  },
  {
    file: 'scripts/ci/maintainability-budget-governance-transform-panel-helper-workflow-footer-rules.mjs',
    maxLines: 30,
    reason: '深度解析 footer helper 治理规则应独立收口，避免 workflow 治理入口继续贴线',
  },
  ...governanceTransformPanelHelperWorkflowActionMaintainabilityBudgets,
  ...governanceTransformPanelHelperWorkflowFooterMaintainabilityBudgets,
];
