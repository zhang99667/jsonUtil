const issueCollectorBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const transformReportIssueCollectorMaintainabilityBudgets = [
  issueCollectorBudget('frontend/src/utils/transformIssueSampleCollectors.ts', 65, '深度解析问题样本 collector 只维护 unresolved、runtime placeholder 和 warning 样本映射'),
  issueCollectorBudget('frontend/src/utils/transformIssueSampleSummary.ts', 35, '深度解析问题样本 summary 只维护三类样本 copied、filtered、total 和 truncated 计数'),
  issueCollectorBudget('frontend/src/utils/transformIssueSampleCollectors.test.ts', 105, '深度解析问题样本 collector 测试只锁定样本筛选和收集顺序'),
  issueCollectorBudget('frontend/src/utils/transformIssueSampleSummary.test.ts', 70, '深度解析问题样本 summary 测试只锁定 copied、filtered、total 和 truncated 计数'),
  issueCollectorBudget('frontend/src/utils/transformReportViewTestFixture.ts', 55, '深度解析通用测试 fixture 只维护 TransformReportView 默认字段和 records 视图构建'),
];
