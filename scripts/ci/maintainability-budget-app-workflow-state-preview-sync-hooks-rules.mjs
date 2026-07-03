import { appWorkflowStatePreviewSyncHookRuntimeMaintainabilityBudgets } from './maintainability-budget-app-workflow-state-preview-sync-hooks-runtime-rules.mjs';
import { appWorkflowStatePreviewSyncHookTestMaintainabilityBudgets } from './maintainability-budget-app-workflow-state-preview-sync-hooks-test-rules.mjs';

export const appWorkflowStatePreviewSyncHookMaintainabilityBudgets = [
  ...appWorkflowStatePreviewSyncHookRuntimeMaintainabilityBudgets,
  ...appWorkflowStatePreviewSyncHookTestMaintainabilityBudgets,
];
