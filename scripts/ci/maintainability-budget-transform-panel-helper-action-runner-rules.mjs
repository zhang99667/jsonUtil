const actionRunnerBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const transformPanelHelperActionRunnerMaintainabilityBudgets = [
  actionRunnerBudget('frontend/src/utils/transformReportActionRunners.ts', 55, '深度解析报告行动 runner 应只负责 action 到面板副作用的分发，不承载文案与排序'),
  actionRunnerBudget('frontend/src/utils/transformReportCopyActionRunner.ts', 35, '深度解析报告复制 runner 应只负责复制、成功提示和错误回调的通用副作用壳'),
  actionRunnerBudget('frontend/src/utils/transformReportCopyActionRunnerTypes.ts', 25, '深度解析报告复制 runner 类型契约应独立维护，避免通用副作用壳被参数声明撑大'),
];
