export const transformReportIssueMaintainabilityBudgets = [
  {
    file: 'frontend/src/utils/transformIssueFilters.ts',
    maxLines: 70,
    reason: '深度解析待检查和跳过记录筛选应保持纯函数模块',
  },
  {
    file: 'frontend/src/utils/transformIssueSamples.ts',
    maxLines: 120,
    reason: '深度解析问题样本 JSON 导出应独立于报告聚合文件，复制报告文本留在专属 formatter',
  },
  {
    file: 'frontend/src/utils/transformIssueSampleReportText.ts',
    maxLines: 100,
    reason: '深度解析问题样本复制报告文本应保持纯文本拼装，不回流到样本 JSON 导出入口',
  },
  {
    file: 'frontend/src/utils/transformIssueRegressionTemplate.ts',
    maxLines: 100,
    reason: '深度解析问题样本回归模板应独立承接脱敏提示和测试骨架文案',
  },
];
