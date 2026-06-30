export const transformPanelHelperActionRunnerMaintainabilityBudgets = [
  {
    file: 'frontend/src/utils/transformReportActionRunners.ts',
    maxLines: 55,
    reason: '深度解析报告行动 runner 应只负责 action 到面板副作用的分发，不承载文案与排序',
  },
  {
    file: 'frontend/src/utils/transformReportCopyActionRunner.ts',
    maxLines: 45,
    reason: '深度解析报告复制 runner 应只负责复制、成功提示和错误回调的通用副作用壳',
  },
];
