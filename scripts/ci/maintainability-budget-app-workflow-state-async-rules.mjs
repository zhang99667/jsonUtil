const stateAsyncBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const appWorkflowStateAsyncMaintainabilityBudgets = [
  stateAsyncBudget('frontend/src/utils/appAsyncPolicy.ts', 80, '主应用异步转换与校验阈值策略应保持纯函数和集中测试'),
  stateAsyncBudget('frontend/src/utils/appAsyncTransformSnapshot.ts', 35, '主应用异步转换身份对象只维护 input、mode 和 autoExpandScheme 的构造与比较'),
  stateAsyncBudget('frontend/src/utils/appAsyncTransformPromiseTask.ts', 75, '主应用异步转换 Promise 分支只维护动态转换、取消保护和 chunk 恢复兜底'),
  stateAsyncBudget('frontend/src/utils/appAsyncTransformPromiseTask.test.ts', 135, 'Promise 分支测试只锁定成功、恢复、失败、取消和请求过期边界'),
  stateAsyncBudget('frontend/src/utils/appAsyncTransformPromiseTaskTimeout.test.ts', 75, '异步转换超时测试只锁定十秒降级、计时器清理和迟到结果隔离'),
  stateAsyncBudget('frontend/src/hooks/useAppAsyncTransformPromiseState.test.ts', 110, 'Promise 状态测试只锁定真实重渲染后的结果新鲜度和处理中终态'),
  stateAsyncBudget('frontend/src/utils/appAsyncTransformWorkerMessages.ts', 60, '主应用异步转换 Worker 消息 helper 只维护请求构造与上下文守卫接线'),
  stateAsyncBudget('frontend/src/utils/appAsyncTransformWorkerMessages.test.ts', 180, '异步转换 Worker 协议测试锁定真实上下文、错误响应、畸形元素和循环值边界'),
  stateAsyncBudget('frontend/src/utils/transformContextValidation.ts', 245, '转换上下文运行时守卫集中校验路径记录、转换步骤、摘要和诊断元素，避免未验形状进入状态'),
  stateAsyncBudget('frontend/src/utils/appAsyncTransformState.ts', 145, '主应用异步转换结果构造、freshness 和输出选择应保持纯函数，副作用留在 App 主入口'),
];
