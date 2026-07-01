import { governanceAiMaintainabilityBudgets } from './maintainability-budget-governance-ai-rules.mjs';

const checkerBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const governanceCheckerMaintainabilityBudgets = [
  checkerBudget('scripts/ci/maintainability-budget-governance-ai-rules.mjs', 35, 'AI 治理预算子表应独立维护治理 CLI、检查器和引用组预算'),
  ...governanceAiMaintainabilityBudgets,
  checkerBudget('scripts/ci/check-maintainability-budgets.mjs', 55, '预算检查 CLI 应只保留参数解析、报告调用、失败输出和摘要打印'),
  checkerBudget('scripts/ci/maintainabilityBudgetReport.mjs', 80, '预算报告 helper 应集中维护行数统计、未纳入规则表检查和临界摘要'),
  checkerBudget('scripts/ci/maintainabilityBudgetUsageSummaries.mjs', 55, '预算 usage 摘要 helper 应只维护 near/high usage 排序和格式化'),
  checkerBudget('scripts/ci/maintainabilityBudgetCliArgs.mjs', 45, '预算检查 CLI 参数解析应独立维护 top 和 threshold 选项'),
  checkerBudget('scripts/ci/maintainability-budget-rules.mjs', 40, '预算规则聚合入口应只负责组合领域规则'),
];
