import { transformPanelHelperActionItemMaintainabilityBudgets } from './maintainability-budget-transform-panel-helper-action-item-rules.mjs';
import { transformPanelHelperActionRunnerMaintainabilityBudgets } from './maintainability-budget-transform-panel-helper-action-runner-rules.mjs';

export const transformPanelHelperActionMaintainabilityBudgets = [
  ...transformPanelHelperActionItemMaintainabilityBudgets,
  ...transformPanelHelperActionRunnerMaintainabilityBudgets,
];
