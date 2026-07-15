import { appWorkflowAiMaintainabilityBudgets } from './maintainability-budget-app-workflow-ai-rules.mjs';
import { appSettingsBackupMaintainabilityBudgets } from './maintainability-budget-app-settings-backup-rules.mjs';
import { appWorkflowCommandMaintainabilityBudgets } from './maintainability-budget-app-workflow-command-rules.mjs';
import { appWorkflowSaveMaintainabilityBudgets } from './maintainability-budget-app-workflow-save-rules.mjs';
import { appWorkflowSourceMaintainabilityBudgets } from './maintainability-budget-app-workflow-source-rules.mjs';
import { appWorkflowStateMaintainabilityBudgets } from './maintainability-budget-app-workflow-state-rules.mjs';
import { appWorkflowSupportMaintainabilityBudgets } from './maintainability-budget-app-workflow-support-rules.mjs';

export const appWorkflowMaintainabilityBudgets = [
  ...appSettingsBackupMaintainabilityBudgets,
  ...appWorkflowAiMaintainabilityBudgets,
  ...appWorkflowCommandMaintainabilityBudgets,
  ...appWorkflowSaveMaintainabilityBudgets,
  ...appWorkflowSourceMaintainabilityBudgets,
  ...appWorkflowStateMaintainabilityBudgets,
  ...appWorkflowSupportMaintainabilityBudgets,
];
