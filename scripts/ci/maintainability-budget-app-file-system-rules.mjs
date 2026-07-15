import { appFileSystemCommandMaintainabilityBudgets } from './maintainability-budget-app-file-system-command-rules.mjs';
import { appFileSystemRuntimeMaintainabilityBudgets } from './maintainability-budget-app-file-system-runtime-rules.mjs';
import { appFileSystemTestMaintainabilityBudgets } from './maintainability-budget-app-file-system-test-rules.mjs';
import { appWorkspaceDraftMaintainabilityBudgets } from './maintainability-budget-app-workspace-draft-rules.mjs';
export const appFileSystemMaintainabilityBudgets = [
  ...appFileSystemCommandMaintainabilityBudgets,
  ...appFileSystemRuntimeMaintainabilityBudgets,
  ...appFileSystemTestMaintainabilityBudgets,
  ...appWorkspaceDraftMaintainabilityBudgets,
];
