import { appWorkflowCommandCoreMaintainabilityBudgets } from './maintainability-budget-app-workflow-command-core-rules.mjs';
import { appWorkflowCommandPanelMaintainabilityBudgets } from './maintainability-budget-app-workflow-command-panel-rules.mjs';
import { appWorkflowCommandTemplateMaintainabilityBudgets } from './maintainability-budget-app-workflow-command-template-rules.mjs';
import { appWorkflowSettingsBackupMaintainabilityBudgets } from './maintainability-budget-app-workflow-settings-backup-rules.mjs';

export const appWorkflowCommandMaintainabilityBudgets = [
  ...appWorkflowCommandCoreMaintainabilityBudgets,
  ...appWorkflowSettingsBackupMaintainabilityBudgets,
  ...appWorkflowCommandTemplateMaintainabilityBudgets,
  ...appWorkflowCommandPanelMaintainabilityBudgets,
];
