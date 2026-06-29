export const transformPanelHelperCmdMaintainabilityBudgets = [
  {
    file: 'frontend/src/utils/transformReportCmdComparison.ts',
    maxLines: 150,
    reason: '深度解析 CMD 对比面板状态应保持轻量，候选推荐和类型定义留在独立模块',
  },
  {
    file: 'frontend/src/utils/transformReportCmdComparisonCandidates.ts',
    maxLines: 140,
    reason: '深度解析 CMD actual 候选推荐应保持纯函数模块，避免回流到面板状态构建',
  },
  {
    file: 'frontend/src/utils/transformReportCmdComparisonTypes.ts',
    maxLines: 60,
    reason: '深度解析 CMD 对比类型应保持稳定、集中导出',
  },
  {
    file: 'frontend/src/utils/transformReportCmdComparisonHelpers.ts',
    maxLines: 70,
    reason: '深度解析 CMD 对比校验、摘要和路径重映射应保持专用纯 helper',
  },
  {
    file: 'frontend/src/utils/transformReportCmdComparisonSummary.ts',
    maxLines: 70,
    reason: '深度解析 CMD 对比报告格式化和面板摘要应保持专用纯 helper',
  },
  {
    file: 'frontend/src/utils/transformReportActiveCmdComparison.ts',
    maxLines: 90,
    reason: '深度解析当前 CMD 对比 record、候选和复制文本构建应保持纯 helper，避免回流主面板',
  },
];
