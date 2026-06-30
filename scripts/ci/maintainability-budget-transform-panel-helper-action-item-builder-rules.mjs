export const transformPanelHelperActionItemBuilderMaintainabilityBudgets = [
  {
    file: 'frontend/src/utils/transformReportIssueTriageItems.ts',
    maxLines: 60,
    reason: '深度解析报告优先处理项 builder 应只组合计数和静态配置',
  },
  {
    file: 'frontend/src/utils/transformReportNextActionItems.ts',
    maxLines: 80,
    reason: '深度解析报告下一步行动 builder 应保持排序编排，静态文案留在配置模块',
  },
];
