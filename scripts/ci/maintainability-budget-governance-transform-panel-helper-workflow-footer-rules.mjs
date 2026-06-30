import { governanceTransformPanelHelperWorkflowFooterWorkflowMaintainabilityBudgets } from './maintainability-budget-governance-transform-panel-helper-workflow-footer-workflow-rules.mjs';

export const governanceTransformPanelHelperWorkflowFooterMaintainabilityBudgets = [
  {
    file: 'scripts/ci/maintainability-budget-transform-panel-helper-footer-rules.mjs',
    maxLines: 25,
    reason: '深度解析 footer helper 预算规则应只组合 workflow 与 contract 子表',
  },
  {
    file: 'scripts/ci/maintainability-budget-transform-panel-helper-footer-contract-rules.mjs',
    maxLines: 20,
    reason: '深度解析 footer 类型和配置预算规则应独立收口，避免 footer helper 规则表继续贴线',
  },
  {
    file: 'scripts/ci/maintainability-budget-governance-transform-panel-helper-workflow-footer-workflow-rules.mjs',
    maxLines: 25,
    reason: '深度解析 footer workflow 治理预算规则应独立收口，避免 footer 治理表继续贴线',
  },
  ...governanceTransformPanelHelperWorkflowFooterWorkflowMaintainabilityBudgets,
];
