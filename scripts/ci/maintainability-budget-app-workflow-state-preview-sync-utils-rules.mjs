import { appWorkflowStatePreviewSyncUtilsRuntimeMaintainabilityBudgets } from './maintainability-budget-app-workflow-state-preview-sync-utils-runtime-rules.mjs';
import { appWorkflowStatePreviewSyncUtilsTestMaintainabilityBudgets } from './maintainability-budget-app-workflow-state-preview-sync-utils-test-rules.mjs';

export const appWorkflowStatePreviewSyncUtilsMaintainabilityBudgets = [
  ...appWorkflowStatePreviewSyncUtilsRuntimeMaintainabilityBudgets,
  ...appWorkflowStatePreviewSyncUtilsTestMaintainabilityBudgets,
];
