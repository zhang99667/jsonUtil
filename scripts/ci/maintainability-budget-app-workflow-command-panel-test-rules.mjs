const commandPanelTestBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const appWorkflowCommandPanelTestMaintainabilityBudgets = [
  commandPanelTestBudget('frontend/src/hooks/useAppToolPanelCommands.test.ts', 190, '工具面板命令测试只锁定面板开关、请求 ID 自增、changelog 事件和报告入口动作'),
  commandPanelTestBudget('frontend/src/hooks/useAppToolPanelCommandsTestFixture.ts', 70, '工具面板命令测试 fixture 只维护窗口 stub、默认 hook 入参和测试句柄返回'),
  commandPanelTestBudget('frontend/src/hooks/useAppToolPanelCommandsReactTestHelper.ts', 70, '工具面板命令 React 测试 helper 只维护 hook mock、effect 清理和 state setter 捕获'),
  commandPanelTestBudget('frontend/src/hooks/useAppToolPanelCommandsStateTestHelper.ts', 55, '工具面板命令 state 测试 helper 只维护 state key 清单、override 判断和初始值读取'),
  commandPanelTestBudget('frontend/src/hooks/useAppToolPanelCommandsWindowTestHelper.ts', 40, '工具面板命令窗口事件测试 helper 只维护 CustomEvent 和 window listener stub'),
];
