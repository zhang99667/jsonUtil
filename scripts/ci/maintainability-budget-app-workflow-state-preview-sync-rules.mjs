import { appWorkflowStatePreviewSyncHookMaintainabilityBudgets } from './maintainability-budget-app-workflow-state-preview-sync-hooks-rules.mjs';
import { appWorkflowStatePreviewSyncUtilsMaintainabilityBudgets } from './maintainability-budget-app-workflow-state-preview-sync-utils-rules.mjs';

export const appWorkflowStatePreviewSyncMaintainabilityBudgets = [
  ...appWorkflowStatePreviewSyncHookMaintainabilityBudgets,
  ...appWorkflowStatePreviewSyncUtilsMaintainabilityBudgets,
];
