export const transformReportIssueCollectorMaintainabilityBudgets = [
  {
    file: 'frontend/src/utils/transformIssueSampleCollectors.ts',
    maxLines: 90,
    reason: '深度解析问题样本 collector 只维护 unresolved、runtime placeholder 和 warning 样本映射及摘要计数',
  },
  {
    file: 'frontend/src/utils/transformIssueSampleCollectors.test.ts',
    maxLines: 160,
    reason: '深度解析问题样本 collector 测试只锁定样本筛选、收集顺序和摘要计数',
  },
];
