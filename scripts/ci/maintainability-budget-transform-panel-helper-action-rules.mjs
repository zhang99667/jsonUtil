export const transformPanelHelperActionMaintainabilityBudgets = [
  {
    file: 'frontend/src/utils/transformReportActionItems.ts',
    maxLines: 40,
    reason: '深度解析报告行动项入口应只保留 issue triage 与 next action 的兼容导出',
  },
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
  {
    file: 'frontend/src/utils/transformReportActionRunners.ts',
    maxLines: 55,
    reason: '深度解析报告行动 runner 应只负责 action 到面板副作用的分发，不承载文案与排序',
  },
  {
    file: 'frontend/src/utils/transformReportActionItemConfig.ts',
    maxLines: 110,
    reason: '深度解析报告行动项静态文案和 action/tone 矩阵应集中维护',
  },
  {
    file: 'frontend/src/utils/transformReportActionItemTypes.ts',
    maxLines: 70,
    reason: '深度解析报告行动项类型应保持稳定、集中导出',
  },
];
