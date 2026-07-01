const stateAsyncBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const appWorkflowStateAsyncMaintainabilityBudgets = [
  stateAsyncBudget('frontend/src/utils/appAsyncPolicy.ts', 80, '主应用异步转换与校验阈值策略应保持纯函数和集中测试'),
  stateAsyncBudget('frontend/src/utils/appAsyncTransformSnapshot.ts', 35, '主应用异步转换身份对象只维护 input、mode 和 autoExpandScheme 的构造与比较'),
  stateAsyncBudget('frontend/src/utils/appAsyncTransformPromiseTask.ts', 75, '主应用异步转换 Promise 分支只维护动态转换、取消保护和 chunk 恢复兜底'),
  stateAsyncBudget('frontend/src/utils/appAsyncTransformWorkerMessages.ts', 45, '主应用异步转换 Worker 消息 helper 只维护请求/响应类型和请求构造'),
  stateAsyncBudget('frontend/src/utils/appAsyncTransformState.ts', 145, '主应用异步转换结果构造、freshness 和输出选择应保持纯函数，副作用留在 App 主入口'),
];
