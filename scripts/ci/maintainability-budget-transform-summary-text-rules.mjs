export const transformSummaryTextMaintainabilityBudgets = [
  {
    file: 'frontend/src/utils/transformReportTextSections.ts',
    maxLines: 35,
    reason: '深度解析报告文本段落入口应只负责兼容导出，具体记录、问题、占位符和分布段落不得回流',
  },
  {
    file: 'frontend/src/utils/transformReportRecordTextLines.ts',
    maxLines: 120,
    reason: '深度解析报告记录明细文本应集中维护路径、参数、内部字段和截断提示，避免报告段落入口继续膨胀',
  },
  {
    file: 'frontend/src/utils/transformReportIssueTextSections.ts',
    maxLines: 70,
    reason: '深度解析报告问题线索文本应集中维护跳过记录和未展开线索文案，避免与占位符或记录明细混杂',
  },
  {
    file: 'frontend/src/utils/transformReportPlaceholderTextSections.ts',
    maxLines: 70,
    reason: '深度解析报告占位符文本应集中维护汇总、来源和明细预览文案，避免复制文本入口重复拼接',
  },
  {
    file: 'frontend/src/utils/transformReportTextDistributionSections.ts',
    maxLines: 120,
    reason: '深度解析报告分布摘要段落应集中治理 schema、资源类型和嵌套字段展示文案',
  },
];
