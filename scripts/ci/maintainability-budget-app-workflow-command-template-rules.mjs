import { appWorkflowCommandTemplateRunnerMaintainabilityBudgets } from './maintainability-budget-app-workflow-command-template-runner-rules.mjs';
import { appWorkflowCommandTemplateShellMaintainabilityBudgets } from './maintainability-budget-app-workflow-command-template-shell-rules.mjs';
import { appWorkflowCommandTemplateSupportMaintainabilityBudgets } from './maintainability-budget-app-workflow-command-template-support-rules.mjs';

export const appWorkflowCommandTemplateMaintainabilityBudgets = [
  ...appWorkflowCommandTemplateShellMaintainabilityBudgets,
  ...appWorkflowCommandTemplateRunnerMaintainabilityBudgets,
  ...appWorkflowCommandTemplateSupportMaintainabilityBudgets,
];
