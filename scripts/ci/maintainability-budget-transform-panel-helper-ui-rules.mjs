export const transformPanelHelperUiMaintainabilityBudgets = [
  {
    file: 'frontend/src/utils/transformReportCopyTitles.ts',
    maxLines: 100,
    reason: '深度解析报告复制入口 title 矩阵应保持纯函数和集中测试',
  },
  {
    file: 'frontend/src/utils/transformReportPanelHelpers.ts',
    maxLines: 40,
    reason: '深度解析报告 UI helper 入口应只保留兼容导出，复制指标和占位符摘要留在专用 helper',
  },
  {
    file: 'frontend/src/utils/transformReportFooterSummary.ts',
    maxLines: 60,
    reason: '深度解析报告 footer 汇总文案应保持纯函数和集中测试',
  },
  {
    file: 'frontend/src/utils/transformReportPanelStyles.ts',
    maxLines: 60,
    reason: '深度解析报告样式映射应保持纯函数和少量 tone 分支',
  },
];
