import { governanceTransformPanelHelperSupportMaintainabilityBudgets } from './maintainability-budget-governance-transform-panel-helper-support-rules.mjs';
import { governanceTransformPanelHelperWorkflowMaintainabilityBudgets } from './maintainability-budget-governance-transform-panel-helper-workflow-rules.mjs';

export const governanceTransformPanelHelperMaintainabilityBudgets = [
  {
    file: 'scripts/ci/maintainability-budget-transform-panel-helper-rules.mjs',
    maxLines: 40,
    reason: '深度解析面板 helper 预算聚合入口应只负责组合子领域规则',
  },
  {
    file: 'scripts/ci/maintainability-budget-governance-transform-panel-helper-workflow-rules.mjs',
    maxLines: 30,
    reason: '深度解析面板行动与 footer helper 治理规则应独立收口，避免 helper 治理入口继续贴线',
  },
  {
    file: 'scripts/ci/maintainability-budget-governance-transform-panel-helper-support-rules.mjs',
    maxLines: 30,
    reason: '深度解析面板 UI、复制和 CMD helper 治理规则应独立收口，避免 helper 治理入口继续贴线',
  },
  ...governanceTransformPanelHelperWorkflowMaintainabilityBudgets,
  ...governanceTransformPanelHelperSupportMaintainabilityBudgets,
];
