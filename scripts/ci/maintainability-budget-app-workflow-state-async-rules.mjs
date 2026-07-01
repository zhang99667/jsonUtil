const stateAsyncBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const appWorkflowStateAsyncMaintainabilityBudgets = [
  stateAsyncBudget('frontend/src/utils/appAsyncPolicy.ts', 80, '主应用异步转换与校验阈值策略应保持纯函数和集中测试'),
  stateAsyncBudget('frontend/src/utils/appAsyncTransformState.ts', 120, '主应用异步转换结果 freshness 和输出选择应保持纯函数，副作用留在 App 主入口'),
];
