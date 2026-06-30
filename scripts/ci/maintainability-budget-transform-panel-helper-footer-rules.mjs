import { transformPanelHelperFooterContractMaintainabilityBudgets } from './maintainability-budget-transform-panel-helper-footer-contract-rules.mjs';
import { transformPanelHelperFooterWorkflowMaintainabilityBudgets } from './maintainability-budget-transform-panel-helper-footer-workflow-rules.mjs';

export const transformPanelHelperFooterMaintainabilityBudgets = [
  ...transformPanelHelperFooterWorkflowMaintainabilityBudgets,
  ...transformPanelHelperFooterContractMaintainabilityBudgets,
];
