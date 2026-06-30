import { governanceTransformPanelHelperSupportCmdMaintainabilityBudgets } from './maintainability-budget-governance-transform-panel-helper-support-cmd-rules.mjs';
import { governanceTransformPanelHelperSupportCopyMaintainabilityBudgets } from './maintainability-budget-governance-transform-panel-helper-support-copy-rules.mjs';
import { governanceTransformPanelHelperSupportUiMaintainabilityBudgets } from './maintainability-budget-governance-transform-panel-helper-support-ui-rules.mjs';

export const governanceTransformPanelHelperSupportMaintainabilityBudgets = [
  {
    file: 'scripts/ci/maintainability-budget-governance-transform-panel-helper-support-ui-rules.mjs',
    maxLines: 15,
    reason: '深度解析 UI helper 治理预算规则应独立收口，避免 support 治理入口继续贴线',
  },
  {
    file: 'scripts/ci/maintainability-budget-governance-transform-panel-helper-support-copy-rules.mjs',
    maxLines: 20,
    reason: '深度解析复制 helper 治理预算规则应独立收口，避免 support 治理入口继续贴线',
  },
  {
    file: 'scripts/ci/maintainability-budget-governance-transform-panel-helper-support-cmd-rules.mjs',
    maxLines: 15,
    reason: '深度解析 CMD helper 治理预算规则应独立收口，避免 support 治理入口继续贴线',
  },
  ...governanceTransformPanelHelperSupportUiMaintainabilityBudgets,
  ...governanceTransformPanelHelperSupportCopyMaintainabilityBudgets,
  ...governanceTransformPanelHelperSupportCmdMaintainabilityBudgets,
];
