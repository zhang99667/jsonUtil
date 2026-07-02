import { transformReportIssueCollectorMaintainabilityBudgets } from './maintainability-budget-transform-report-issue-collector-rules.mjs';

const issueBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const transformReportIssueMaintainabilityBudgets = [
  issueBudget('frontend/src/utils/transformIssueFilters.ts', 70, '深度解析待检查和跳过记录筛选应保持纯函数模块'),
  issueBudget('frontend/src/utils/transformIssueSamples.ts', 120, '深度解析问题样本 JSON 导出应独立于报告聚合文件，复制报告文本留在专属 formatter'),
  issueBudget('frontend/src/utils/transformIssueSamples.test.ts', 70, '深度解析问题样本导出入口测试只锁定导出结构、摘要计数和空样本文本'),
  ...transformReportIssueCollectorMaintainabilityBudgets,
  issueBudget('frontend/src/utils/transformIssueSampleReportText.ts', 100, '深度解析问题样本复制报告文本应保持纯文本拼装，不回流到样本 JSON 导出入口'),
  issueBudget('frontend/src/utils/transformIssueRegressionTemplate.ts', 100, '深度解析问题样本回归模板应独立承接脱敏提示和测试骨架文案'),
];
