const appJsonPathComponentTestCoreBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const appJsonPathComponentTestCoreMaintainabilityBudgets = [
  appJsonPathComponentTestCoreBudget('frontend/src/components/JsonPathPanelFavoriteToggleButton.test.tsx', 55, 'JSONPath 收藏按钮测试只锁定空心/实心星标、禁用态和可访问文案'),
  appJsonPathComponentTestCoreBudget('frontend/src/components/JsonPathPanelQueryInput.test.tsx', 85, 'JSONPath 查询输入测试只锁定输入框、收藏按钮、查询动作和状态提示装配'),
  appJsonPathComponentTestCoreBudget('frontend/src/components/JsonPathPanelQueryInputField.test.tsx', 65, 'JSONPath 查询输入框测试只锁定输入属性、错误状态和文本变化回调'),
  appJsonPathComponentTestCoreBudget('frontend/src/components/JsonPathPanelQueryActionButtons.test.tsx', 70, 'JSONPath 查询动作按钮测试只锁定查询、取消、准备中禁用和隐藏说明'),
  appJsonPathComponentTestCoreBudget('frontend/src/components/JsonPathPanelQueryStatus.test.tsx', 50, 'JSONPath 查询状态测试只锁定空闲隐藏、查询中和已取消文案优先级'),
];
