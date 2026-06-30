import { governanceAiMaintainabilityBudgets } from './maintainability-budget-governance-ai-rules.mjs';

export const governanceCheckerMaintainabilityBudgets = [
  {
    file: 'scripts/ci/maintainability-budget-governance-ai-rules.mjs',
    maxLines: 35,
    reason: 'AI 治理预算子表应独立维护治理 CLI、检查器和引用组预算',
  },
  ...governanceAiMaintainabilityBudgets,
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
