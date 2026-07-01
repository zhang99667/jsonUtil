const governanceCommandBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const governanceAppWorkflowCommandMaintainabilityBudgets = [
  governanceCommandBudget('scripts/ci/maintainability-budget-app-workflow-command-rules.mjs', 20, 'App 命令工作流预算入口应只组合 core、设置备份、模板填充和工具面板子表'),
  governanceCommandBudget('scripts/ci/maintainability-budget-app-workflow-command-core-rules.mjs', 20, 'App 命令核心预算规则应只维护自动保存、复制和智能建议命令预算'),
  governanceCommandBudget('scripts/ci/maintainability-budget-app-workflow-settings-backup-rules.mjs', 15, '设置备份命令预算规则应独立维护 hook、导出、导入和类型契约预算'),
  governanceCommandBudget('scripts/ci/maintainability-budget-app-workflow-command-template-rules.mjs', 20, '模板填充命令预算规则应独立维护模板填充 runner、helper 和测试预算'),
  governanceCommandBudget('scripts/ci/maintainability-budget-app-workflow-command-panel-rules.mjs', 15, '工具面板命令预算规则应独立维护面板命令 hook、计划 helper、测试和 fixture 预算'),
];
