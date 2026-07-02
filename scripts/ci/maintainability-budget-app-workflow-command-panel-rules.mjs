const commandPanelBudget = (file, maxLines, reason) => ({ file, maxLines, reason });
export const appWorkflowCommandPanelMaintainabilityBudgets = [
  commandPanelBudget('frontend/src/hooks/useAppToolPanelCommands.ts', 310, '主应用工具面板命令 hook 只维护面板开关、外部请求信号、changelog 监听和报告入口动作，继续增长时按面板域拆分'),
  commandPanelBudget('frontend/src/utils/appToolPanelCommandPlans.ts', 120, '工具面板命令计划 helper 只维护请求 ID、面板事件名、SOURCE Scheme 判断和 Changelog 状态归一化'),
  commandPanelBudget('frontend/src/utils/appToolPanelCommandPlans.test.ts', 120, '工具面板命令计划测试只锁定请求构造、事件名、Scheme 判断、Changelog 和模板请求边界'),
  commandPanelBudget('frontend/src/hooks/useAppToolPanelCommands.test.ts', 190, '工具面板命令测试只锁定面板开关、请求 ID 自增、changelog 事件和报告入口动作'),
  commandPanelBudget('frontend/src/hooks/useAppToolPanelCommandsTestFixture.ts', 130, '工具面板命令测试 fixture 只维护 React hook mock、state setter 捕获和默认 hook 入参'),
  commandPanelBudget('frontend/src/hooks/useAppToolPanelCommandsWindowTestHelper.ts', 40, '工具面板命令窗口事件测试 helper 只维护 CustomEvent 和 window listener stub'),
];
