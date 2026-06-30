import { transformPanelHelperActionItemBuilderMaintainabilityBudgets } from './maintainability-budget-transform-panel-helper-action-item-builder-rules.mjs';
import { transformPanelHelperActionItemContractMaintainabilityBudgets } from './maintainability-budget-transform-panel-helper-action-item-contract-rules.mjs';

export const transformPanelHelperActionItemMaintainabilityBudgets = [
  ...transformPanelHelperActionItemBuilderMaintainabilityBudgets,
  ...transformPanelHelperActionItemContractMaintainabilityBudgets,
];
