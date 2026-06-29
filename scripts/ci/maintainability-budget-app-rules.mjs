import { appCoreMaintainabilityBudgets } from './maintainability-budget-app-core-rules.mjs';
import { appWorkflowMaintainabilityBudgets } from './maintainability-budget-app-workflow-rules.mjs';

export const appMaintainabilityBudgets = [
  ...appCoreMaintainabilityBudgets,
  ...appWorkflowMaintainabilityBudgets,
];
