import { appWorkflowCommandCoreMaintainabilityBudgets } from './maintainability-budget-app-workflow-command-core-rules.mjs';
import { appWorkflowCommandPanelMaintainabilityBudgets } from './maintainability-budget-app-workflow-command-panel-rules.mjs';
import { appWorkflowCommandSchemeMaintainabilityBudgets } from './maintainability-budget-app-workflow-command-scheme-rules.mjs';
import { appWorkflowCommandSmartSuggestionMaintainabilityBudgets } from './maintainability-budget-app-workflow-command-smart-suggestion-rules.mjs';
import { appWorkflowCommandTemplateMaintainabilityBudgets } from './maintainability-budget-app-workflow-command-template-rules.mjs';
import { appWorkflowSettingsBackupMaintainabilityBudgets } from './maintainability-budget-app-workflow-settings-backup-rules.mjs';

export const appWorkflowCommandMaintainabilityBudgets = [
  ...appWorkflowCommandCoreMaintainabilityBudgets,
  ...appWorkflowCommandSmartSuggestionMaintainabilityBudgets,
  ...appWorkflowCommandSchemeMaintainabilityBudgets,
  ...appWorkflowSettingsBackupMaintainabilityBudgets,
  ...appWorkflowCommandTemplateMaintainabilityBudgets,
  ...appWorkflowCommandPanelMaintainabilityBudgets,
];
