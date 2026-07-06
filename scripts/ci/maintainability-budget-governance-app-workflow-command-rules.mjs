const governanceCommandBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const governanceAppWorkflowCommandMaintainabilityBudgets = [
  governanceCommandBudget('scripts/ci/maintainability-budget-app-workflow-command-rules.mjs', 20, 'App 命令工作流预算入口应只组合 core、Scheme、设置备份、模板填充和工具面板子表'),
  governanceCommandBudget('scripts/ci/maintainability-budget-app-workflow-command-core-rules.mjs', 25, 'App 命令核心预算规则应只组合自动保存子表并维护复制、面板布局和智能建议命令预算'),
  governanceCommandBudget('scripts/ci/maintainability-budget-app-workflow-command-scheme-rules.mjs', 20, 'Scheme 命令预算规则应独立维护编辑回写 hook、runner 和对应测试预算'),
  governanceCommandBudget('scripts/ci/maintainability-budget-app-workflow-command-auto-save-rules.mjs', 20, '自动保存命令预算规则应独立维护计划 helper、hook 和对应测试预算'),
  governanceCommandBudget('scripts/ci/maintainability-budget-app-workflow-settings-backup-rules.mjs', 20, '设置备份命令预算规则应独立维护 hook、adapter、拆分测试和类型契约预算'),
  governanceCommandBudget('scripts/ci/maintainability-budget-app-workflow-command-template-rules.mjs', 15, '模板填充命令预算入口应只组合 shell、runner 和 support 子表'),
  governanceCommandBudget('scripts/ci/maintainability-budget-app-workflow-command-template-shell-rules.mjs', 15, '模板填充命令 shell 预算规则应独立维护 hook、effects helper 和 effects 测试预算'),
  governanceCommandBudget('scripts/ci/maintainability-budget-app-workflow-command-template-runner-rules.mjs', 20, '模板填充命令 runner 预算规则应独立维护 runner、失败路径、fixture 和断言 helper 预算'),
  governanceCommandBudget('scripts/ci/maintainability-budget-app-workflow-command-template-support-rules.mjs', 20, '模板填充命令 support 预算规则应独立维护目标错误和质量 delta helper 预算'),
  governanceCommandBudget('scripts/ci/maintainability-budget-app-workflow-command-panel-rules.mjs', 20, '工具面板命令预算规则应独立维护面板命令 hook、计划 helper、测试和 fixture 预算'),
  governanceCommandBudget('scripts/ci/maintainability-budget-app-workflow-command-panel-test-rules.mjs', 35, '工具面板命令测试预算规则应独立维护测试文件、fixture 和 test helper 预算'),
];
