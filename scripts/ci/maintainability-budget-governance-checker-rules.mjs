import { governanceAiMaintainabilityBudgets } from './maintainability-budget-governance-ai-rules.mjs';

const checkerBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const governanceCheckerMaintainabilityBudgets = [
  ...governanceAiMaintainabilityBudgets,
  checkerBudget('scripts/ci/check-chunk-load-recovery-catches.mjs', 35, 'chunk 恢复 catch 检查 CLI 应只负责报告输出，AST 扫描逻辑放在独立 helper'),
  checkerBudget('scripts/ci/chunkLoadRecoveryCatchAudit.mjs', 170, 'chunk 恢复 catch AST 检查应只维护动态 import 识别和 dispatch 缺失报告'),
  checkerBudget('scripts/ci/chunkLoadRecoveryCatchAst.mjs', 55, 'chunk 恢复 catch AST 基础 helper 应只封装 TypeScript AST 通用访问和节点命名'),
  checkerBudget('scripts/ci/chunkLoadRecoverySourceFiles.mjs', 40, 'chunk 恢复源码收集 helper 应只维护前端源码遍历和测试文件排除规则'),
  checkerBudget('scripts/ci/check-maintainability-budgets.mjs', 55, '预算检查 CLI 应只保留参数解析、报告调用、失败输出和摘要打印'),
  checkerBudget('scripts/ci/maintainabilityBudgetReport.mjs', 80, '预算报告 helper 应集中维护行数统计、预算使用率收集和临界摘要'),
  checkerBudget('scripts/ci/maintainabilityBudgetRuleFiles.mjs', 35, '预算规则文件 helper 应只维护规则表枚举和未纳入自检失败收集'),
  checkerBudget('scripts/ci/maintainabilityBudgetUsageSummaries.mjs', 55, '预算 usage 摘要 helper 应只维护 near/high usage 排序和格式化'),
  checkerBudget('scripts/ci/maintainabilityBudgetCliArgs.mjs', 45, '预算检查 CLI 参数解析应独立维护 top、threshold 和 no-all 选项'),
  checkerBudget('scripts/ci/maintainability-budget-rules.mjs', 40, '预算规则聚合入口应只负责组合领域规则'),
];
