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
    file: 'frontend/src/utils/transformReportPlaceholderToolbarState.ts',
    maxLines: 45,
    reason: '深度解析占位符工具栏状态应保持纯派生，不承载 handler 或 JSX',
  },
  {
    file: 'frontend/src/utils/transformReportSectionVisibility.ts',
    maxLines: 45,
    reason: '深度解析报告 section 可见性应保持纯计数派生，避免 JSX 内重复判断',
  },
  {
    file: 'frontend/src/utils/transformReportPanelStyles.ts',
    maxLines: 60,
    reason: '深度解析报告样式映射应保持纯函数和少量 tone 分支',
  },
];
