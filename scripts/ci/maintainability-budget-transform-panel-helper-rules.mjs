import { transformPanelHelperActionMaintainabilityBudgets } from './maintainability-budget-transform-panel-helper-action-rules.mjs';
import { transformPanelHelperCmdMaintainabilityBudgets } from './maintainability-budget-transform-panel-helper-cmd-rules.mjs';
import { transformPanelHelperCopyMaintainabilityBudgets } from './maintainability-budget-transform-panel-helper-copy-rules.mjs';
import { transformPanelHelperFooterMaintainabilityBudgets } from './maintainability-budget-transform-panel-helper-footer-rules.mjs';
import { transformPanelHelperUiMaintainabilityBudgets } from './maintainability-budget-transform-panel-helper-ui-rules.mjs';

export const transformPanelHelperMaintainabilityBudgets = [
  ...transformPanelHelperActionMaintainabilityBudgets,
  ...transformPanelHelperUiMaintainabilityBudgets,
  ...transformPanelHelperCopyMaintainabilityBudgets,
  ...transformPanelHelperFooterMaintainabilityBudgets,
  ...transformPanelHelperCmdMaintainabilityBudgets,
];
