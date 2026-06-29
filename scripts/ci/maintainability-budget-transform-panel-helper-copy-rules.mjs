export const transformPanelHelperCopyMaintainabilityBudgets = [
  {
    file: 'frontend/src/utils/transformReportCopyMetrics.ts',
    maxLines: 60,
    reason: '深度解析报告复制大小、路径值复制数量和限制判断应保持纯函数模块',
  },
  {
    file: 'frontend/src/utils/transformReportDecodedSchemeInput.ts',
    maxLines: 40,
    reason: '深度解析内部字段转 Scheme 输入应保持独立小函数，避免回流到面板组件',
  },
  {
    file: 'frontend/src/utils/transformReportCopyTitleHelpers.ts',
    maxLines: 40,
    reason: '深度解析报告复制 title 基础状态应保持独立小函数',
  },
  {
    file: 'frontend/src/utils/transformReportPlaceholderFillSummary.ts',
    maxLines: 70,
    reason: '深度解析占位符回填摘要和模板 title 应保持纯函数模块',
  },
];
