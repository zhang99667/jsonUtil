import { transformPanelComponentMaintainabilityBudgets } from './maintainability-budget-transform-panel-component-rules.mjs';
import { transformPanelHelperMaintainabilityBudgets } from './maintainability-budget-transform-panel-helper-rules.mjs';
import { transformPanelRecordSectionMaintainabilityBudgets } from './maintainability-budget-transform-panel-record-section-rules.mjs';
import { transformPanelSectionMaintainabilityBudgets } from './maintainability-budget-transform-panel-section-rules.mjs';

export const transformPanelMaintainabilityBudgets = [
  ...transformPanelComponentMaintainabilityBudgets,
  ...transformPanelRecordSectionMaintainabilityBudgets,
  ...transformPanelSectionMaintainabilityBudgets,
  ...transformPanelHelperMaintainabilityBudgets,
];
