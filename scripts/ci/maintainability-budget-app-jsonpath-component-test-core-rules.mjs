const appJsonPathComponentTestCoreBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const appJsonPathComponentTestCoreMaintainabilityBudgets = [
  appJsonPathComponentTestCoreBudget('frontend/src/components/JsonPathPanelFavoriteToggleButton.test.tsx', 55, 'JSONPath 收藏按钮测试只锁定空心/实心星标、禁用态和可访问文案'),
  appJsonPathComponentTestCoreBudget('frontend/src/components/JsonPathPanelQueryInput.test.tsx', 70, 'JSONPath 查询输入测试只锁定控件行和状态提示装配'),
  appJsonPathComponentTestCoreBudget('frontend/src/components/JsonPathPanelQueryInputControls.test.tsx', 85, 'JSONPath 查询输入控件行测试只锁定输入框、收藏按钮和查询动作装配'),
  appJsonPathComponentTestCoreBudget('frontend/src/components/JsonPathPanelQueryInputField.test.tsx', 65, 'JSONPath 查询输入框测试只锁定输入属性、错误状态和文本变化回调'),
  appJsonPathComponentTestCoreBudget('frontend/src/components/JsonPathPanelQueryActionButtons.test.tsx', 60, 'JSONPath 查询动作按钮测试只锁定运行按钮装配、取消按钮和准备中透传'),
  appJsonPathComponentTestCoreBudget('frontend/src/components/JsonPathPanelQueryRunButton.test.tsx', 65, 'JSONPath 查询运行按钮测试只锁定按钮状态、隐藏说明、无障碍关联和点击回调'),
  appJsonPathComponentTestCoreBudget('frontend/src/components/JsonPathPanelQueryCancelButton.test.tsx', 45, 'JSONPath 查询取消按钮测试只锁定按钮属性、可见文案和点击回调'),
  appJsonPathComponentTestCoreBudget('frontend/src/components/JsonPathPanelQueryStatus.test.tsx', 50, 'JSONPath 查询状态测试只锁定空闲隐藏、查询中和已取消文案优先级'),
  appJsonPathComponentTestCoreBudget('frontend/src/components/JsonPathPanelTitle.test.tsx', 40, 'JSONPath 面板标题测试只锁定标题文案、帮助入口文案和打开参数'),
];
