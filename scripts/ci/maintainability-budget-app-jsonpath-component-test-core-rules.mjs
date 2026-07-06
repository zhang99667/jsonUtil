const appJsonPathComponentTestCoreBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const appJsonPathComponentTestCoreMaintainabilityBudgets = [
  appJsonPathComponentTestCoreBudget('frontend/src/components/JsonPathPanelFavoriteToggleButton.test.tsx', 55, 'JSONPath 收藏按钮测试只锁定空心/实心星标、禁用态和可访问文案'),
  appJsonPathComponentTestCoreBudget('frontend/src/components/JsonPathPanelQueryInput.test.tsx', 85, 'JSONPath 查询输入测试只锁定输入框、收藏按钮、查询动作和状态提示装配'),
  appJsonPathComponentTestCoreBudget('frontend/src/components/JsonPathPanelQueryInputField.test.tsx', 65, 'JSONPath 查询输入框测试只锁定输入属性、错误状态和文本变化回调'),
  appJsonPathComponentTestCoreBudget('frontend/src/components/JsonPathPanelQueryActionButtons.test.tsx', 70, 'JSONPath 查询动作按钮测试只锁定查询、取消、准备中禁用和隐藏说明'),
  appJsonPathComponentTestCoreBudget('frontend/src/components/JsonPathPanelQueryStatus.test.tsx', 50, 'JSONPath 查询状态测试只锁定空闲隐藏、查询中和已取消文案优先级'),
  appJsonPathComponentTestCoreBudget('frontend/src/components/JsonPathPanelResultPreviewRow.test.tsx', 60, 'JSONPath 结果预览行测试只锁定路径来源值展示、点击下标和结构定位入口装配'),
  appJsonPathComponentTestCoreBudget('frontend/src/components/JsonPathPanelResultPreviewLocateButton.test.tsx', 55, 'JSONPath 结果预览结构定位按钮测试只锁定按钮属性、隐藏图标和点击下标'),
  appJsonPathComponentTestCoreBudget('frontend/src/components/JsonPathPanelResultToolbar.test.tsx', 60, 'JSONPath 结果工具条测试只锁定状态文案和动作列表接线'),
  appJsonPathComponentTestCoreBudget('frontend/src/components/JsonPathPanelResultToolbarActionList.test.tsx', 95, 'JSONPath 结果工具条动作列表测试只锁定按钮配置、禁用态、图标和点击接线'),
];
