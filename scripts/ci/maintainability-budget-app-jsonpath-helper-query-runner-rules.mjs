const appJsonPathHelperQueryRunnerBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const appJsonPathHelperQueryRunnerMaintainabilityBudgets = [
  appJsonPathHelperQueryRunnerBudget('frontend/src/hooks/useJsonPathPanelQueryRunner.ts', 300, 'JSONPath 查询 runner hook 只维护查询 reducer、worker 生命周期、取消、外部查询请求和结果聚焦接线'),
  appJsonPathHelperQueryRunnerBudget('frontend/src/hooks/useJsonPathPanelQueryRunner.test.ts', 190, 'JSONPath 查询 runner 主流程测试只锁定 worker 请求、成功、请求所有权、旧请求晚到、取消和卸载清理'),
  appJsonPathHelperQueryRunnerBudget('frontend/src/hooks/useJsonPathPanelQueryRunnerEdgeCases.test.ts', 160, 'JSONPath 查询 runner 边界测试只锁定准备中、空输入和 worker 运行、创建、发送失败及失败终态所有权'),
  appJsonPathHelperQueryRunnerBudget('frontend/src/hooks/useJsonPathPanelQueryRunnerTestFixture.ts', 100, 'JSONPath 查询 runner 测试夹具只维护 React hook mock、fake worker、worker 响应和默认输入装配'),
  appJsonPathHelperQueryRunnerBudget('frontend/src/utils/jsonPathPanelQueryRunDecision.ts', 80, 'JSONPath 查询前置决策 helper 只维护查询归一化、跳过原因和字段快捷输入同步决策'),
  appJsonPathHelperQueryRunnerBudget('frontend/src/utils/jsonPathPanelQueryRunDecision.test.ts', 90, 'JSONPath 查询前置决策测试只锁定可执行查询、跳过原因、清理标记和字段快捷输入同步顺序'),
  appJsonPathHelperQueryRunnerBudget('frontend/src/utils/jsonPathPanelQueryWorker.ts', 90, 'JSONPath 查询 worker helper 只维护 worker 协议、请求组装和成功 payload 映射'),
  appJsonPathHelperQueryRunnerBudget('frontend/src/utils/jsonPathPanelQueryTelemetry.ts', 40, 'JSONPath 查询埋点 helper 只维护查询耗时、输入大小和状态事件上报'),
];
