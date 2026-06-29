export const governanceCheckerMaintainabilityBudgets = [
  {
    file: 'scripts/ci/check-ai-governance.mjs',
    maxLines: 180,
    reason: 'AI 治理检查应保持简单确定，复杂规则应拆成独立检查',
  },
  {
    file: 'scripts/ci/check-maintainability-budgets.mjs',
    maxLines: 80,
    reason: '预算检查脚本应只保留执行逻辑，规则清单放在独立模块',
  },
  {
    file: 'scripts/ci/maintainability-budget-rules.mjs',
    maxLines: 40,
    reason: '预算规则聚合入口应只负责组合领域规则',
  },
  {
    file: 'scripts/ci/maintainability-budget-infra-rules.mjs',
    maxLines: 30,
    reason: '基础设施预算规则应只保留前端构建配置等少量条目',
  },
];
