import { transformPanelPlaceholderSectionMaintainabilityBudgets } from './maintainability-budget-transform-panel-placeholder-section-rules.mjs';
import { transformPanelIssueSectionMaintainabilityBudgets } from './maintainability-budget-transform-panel-section-issue-rules.mjs';
import { transformPanelSectionSmallMaintainabilityBudgets } from './maintainability-budget-transform-panel-section-small-rules.mjs';
import { transformPanelSummarySectionMaintainabilityBudgets } from './maintainability-budget-transform-panel-section-summary-rules.mjs';

export const transformPanelSectionMaintainabilityBudgets = [
  ...transformPanelSectionSmallMaintainabilityBudgets,
  ...transformPanelPlaceholderSectionMaintainabilityBudgets,
  ...transformPanelSummarySectionMaintainabilityBudgets,
  ...transformPanelIssueSectionMaintainabilityBudgets,
];
