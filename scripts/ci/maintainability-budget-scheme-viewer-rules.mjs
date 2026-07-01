import { schemeViewerComponentMaintainabilityBudgets } from './maintainability-budget-scheme-viewer-component-rules.mjs';
import { schemeViewerSupportMaintainabilityBudgets } from './maintainability-budget-scheme-viewer-support-rules.mjs';

export const schemeViewerMaintainabilityBudgets = [
  ...schemeViewerComponentMaintainabilityBudgets,
  ...schemeViewerSupportMaintainabilityBudgets,
];
