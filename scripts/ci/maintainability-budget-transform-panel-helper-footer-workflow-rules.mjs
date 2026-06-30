import { transformPanelHelperFooterWorkflowActionMaintainabilityBudgets } from './maintainability-budget-transform-panel-helper-footer-workflow-action-rules.mjs';
import { transformPanelHelperFooterWorkflowHandlerMaintainabilityBudgets } from './maintainability-budget-transform-panel-helper-footer-workflow-handler-rules.mjs';

export const transformPanelHelperFooterWorkflowMaintainabilityBudgets = [
  ...transformPanelHelperFooterWorkflowActionMaintainabilityBudgets,
  ...transformPanelHelperFooterWorkflowHandlerMaintainabilityBudgets,
];
