import { governanceAppEditorMaintainabilityBudgets } from './maintainability-budget-governance-app-editor-rules.mjs';
import { governanceAppShellMaintainabilityBudgets } from './maintainability-budget-governance-app-shell-rules.mjs';
import { governanceAppWorkflowMaintainabilityBudgets } from './maintainability-budget-governance-app-workflow-rules.mjs';

const governanceAppBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const governanceAppMaintainabilityBudgets = [
  ...governanceAppEditorMaintainabilityBudgets,
  ...governanceAppWorkflowMaintainabilityBudgets,
  ...governanceAppShellMaintainabilityBudgets,
  governanceAppBudget('scripts/ci/maintainability-budget-governance-app-shell-rules.mjs', 45, 'App shell 治理预算规则应独立维护非工作流和非编辑器子表预算'),
  governanceAppBudget('scripts/ci/maintainability-budget-governance-app-workflow-rules.mjs', 55, 'App 工作流预算治理规则应独立维护工作流子表预算'),
  governanceAppBudget('scripts/ci/maintainability-budget-governance-app-rules.mjs', 20, 'App 预算治理入口应只组合 editor、workflow 和 shell 治理子表'),
];
