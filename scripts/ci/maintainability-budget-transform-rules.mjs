import { transformCoreMaintainabilityBudgets } from './maintainability-budget-transform-core-rules.mjs';
import { transformPanelMaintainabilityBudgets } from './maintainability-budget-transform-panel-rules.mjs';
import { transformReportMaintainabilityBudgets } from './maintainability-budget-transform-report-rules.mjs';

export const transformMaintainabilityBudgets = [
  ...transformCoreMaintainabilityBudgets,
  ...transformPanelMaintainabilityBudgets,
  ...transformReportMaintainabilityBudgets,
];
