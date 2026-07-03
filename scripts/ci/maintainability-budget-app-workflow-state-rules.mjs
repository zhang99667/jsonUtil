import { appWorkflowStateCoreMaintainabilityBudgets } from './maintainability-budget-app-workflow-state-core-rules.mjs';
import { appWorkflowStateHelperMaintainabilityBudgets } from './maintainability-budget-app-workflow-state-helper-rules.mjs';
import { appWorkflowStatePreviewSyncMaintainabilityBudgets } from './maintainability-budget-app-workflow-state-preview-sync-rules.mjs';

export const appWorkflowStateMaintainabilityBudgets = [
  ...appWorkflowStateCoreMaintainabilityBudgets,
  ...appWorkflowStateHelperMaintainabilityBudgets,
  ...appWorkflowStatePreviewSyncMaintainabilityBudgets,
];
