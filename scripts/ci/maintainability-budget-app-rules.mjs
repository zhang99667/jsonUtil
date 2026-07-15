import { appActionPanelMaintainabilityBudgets } from './maintainability-budget-app-action-panel-rules.mjs';
import { appComponentMaintainabilityBudgets } from './maintainability-budget-app-component-rules.mjs';
import { appCoreMaintainabilityBudgets } from './maintainability-budget-app-core-rules.mjs';
import { appEditorMaintainabilityBudgets } from './maintainability-budget-app-editor-rules.mjs';
import { appEditorPreviewMaintainabilityBudgets } from './maintainability-budget-app-editor-preview-rules.mjs';
import { appEditorSourceMaintainabilityBudgets } from './maintainability-budget-app-editor-source-rules.mjs';
import { appJsonPathMaintainabilityBudgets } from './maintainability-budget-app-jsonpath-rules.mjs';
import { jsonSchemaExampleMaintainabilityBudgets } from './maintainability-budget-app-json-schema-example-rules.mjs';
import { appRecoveryMaintainabilityBudgets } from './maintainability-budget-app-recovery-rules.mjs';
import { appShellMaintainabilityBudgets } from './maintainability-budget-app-shell-rules.mjs';
import { appStatusMaintainabilityBudgets } from './maintainability-budget-app-status-rules.mjs';
import { appStructureNavMaintainabilityBudgets } from './maintainability-budget-app-structure-nav-rules.mjs';
import { appTemplateFillMaintainabilityBudgets } from './maintainability-budget-app-template-fill-rules.mjs';
import { appWorkflowMaintainabilityBudgets } from './maintainability-budget-app-workflow-rules.mjs';

export const appMaintainabilityBudgets = [
  ...appActionPanelMaintainabilityBudgets,
  ...appCoreMaintainabilityBudgets,
  ...appComponentMaintainabilityBudgets,
  ...appEditorMaintainabilityBudgets,
  ...appEditorPreviewMaintainabilityBudgets,
  ...appEditorSourceMaintainabilityBudgets,
  ...appJsonPathMaintainabilityBudgets,
  ...jsonSchemaExampleMaintainabilityBudgets,
  ...appRecoveryMaintainabilityBudgets,
  ...appShellMaintainabilityBudgets,
  ...appStatusMaintainabilityBudgets,
  ...appStructureNavMaintainabilityBudgets,
  ...appTemplateFillMaintainabilityBudgets,
  ...appWorkflowMaintainabilityBudgets,
];
