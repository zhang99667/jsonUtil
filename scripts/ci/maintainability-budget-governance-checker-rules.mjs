export const governanceCheckerMaintainabilityBudgets = [
  {
    file: 'scripts/ci/check-ai-governance.mjs',
    maxLines: 45,
    reason: 'AI 治理检查 CLI 应只负责执行报告和输出错误，规则与收集逻辑放在独立模块',
  },
  {
    file: 'scripts/ci/aiGovernanceChecks.mjs',
    maxLines: 80,
    reason: 'AI 治理缺失收集应只负责文件内容检查和 report 组装，规则构造放在独立模块',
  },
  {
    file: 'scripts/ci/aiGovernanceRules.mjs',
    maxLines: 100,
    reason: 'AI 治理规则构造应集中维护必需文件和关键引用清单，便于单测覆盖',
  },
  {
    file: 'scripts/ci/check-maintainability-budgets.mjs',
    maxLines: 45,
    reason: '预算检查 CLI 应只保留报告调用、失败输出和摘要打印',
  },
  {
    file: 'scripts/ci/maintainabilityBudgetReport.mjs',
    maxLines: 80,
    reason: '预算报告 helper 应集中维护行数统计、未纳入规则表检查和临界摘要',
  },
  {
    file: 'scripts/ci/maintainability-budget-rules.mjs',
    maxLines: 40,
    reason: '预算规则聚合入口应只负责组合领域规则',
  },
];
