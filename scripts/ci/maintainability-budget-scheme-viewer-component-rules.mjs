import { schemeViewerDetailComponentMaintainabilityBudgets } from './maintainability-budget-scheme-viewer-detail-component-rules.mjs';
import { schemeViewerShellComponentMaintainabilityBudgets } from './maintainability-budget-scheme-viewer-shell-component-rules.mjs';

export const schemeViewerComponentMaintainabilityBudgets = [
  ...schemeViewerShellComponentMaintainabilityBudgets,
  ...schemeViewerDetailComponentMaintainabilityBudgets,
];
