import { appWorkflowStateAsyncMaintainabilityBudgets } from './maintainability-budget-app-workflow-state-async-rules.mjs';
import { appWorkflowStateUiMaintainabilityBudgets } from './maintainability-budget-app-workflow-state-ui-rules.mjs';

export const appWorkflowStateCoreMaintainabilityBudgets = [
  ...appWorkflowStateAsyncMaintainabilityBudgets,
  ...appWorkflowStateUiMaintainabilityBudgets,
];
