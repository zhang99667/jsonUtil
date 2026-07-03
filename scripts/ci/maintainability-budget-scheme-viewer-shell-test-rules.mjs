import { schemeViewerShellFooterTestMaintainabilityBudgets } from './maintainability-budget-scheme-viewer-shell-footer-test-rules.mjs';
import { schemeViewerShellSupportTestMaintainabilityBudgets } from './maintainability-budget-scheme-viewer-shell-support-test-rules.mjs';

export const schemeViewerShellTestMaintainabilityBudgets = [
  ...schemeViewerShellFooterTestMaintainabilityBudgets,
  ...schemeViewerShellSupportTestMaintainabilityBudgets,
];
