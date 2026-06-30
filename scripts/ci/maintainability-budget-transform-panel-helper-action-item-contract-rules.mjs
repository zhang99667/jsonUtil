export const transformPanelHelperActionItemContractMaintainabilityBudgets = [
  {
    file: 'frontend/src/utils/transformReportActionItems.ts',
    maxLines: 40,
    reason: '深度解析报告行动项入口应只保留 issue triage 与 next action 的兼容导出',
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
