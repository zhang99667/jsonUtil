const appJsonPathComponentTestCoreBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const appJsonPathComponentTestCoreMaintainabilityBudgets = [
  appJsonPathComponentTestCoreBudget('frontend/src/components/JsonPathPanelFavoriteToggleButton.test.tsx', 55, 'JSONPath 收藏按钮测试只锁定空心/实心星标、禁用态和可访问文案'),
  appJsonPathComponentTestCoreBudget('frontend/src/components/JsonPathPanelQueryActionButtons.test.tsx', 70, 'JSONPath 查询动作按钮测试只锁定查询、取消、准备中禁用和隐藏说明'),
  appJsonPathComponentTestCoreBudget('frontend/src/components/JsonPathPanelQueryStatus.test.tsx', 50, 'JSONPath 查询状态测试只锁定空闲隐藏、查询中和已取消文案优先级'),
  appJsonPathComponentTestCoreBudget('frontend/src/components/JsonPathPanelResultPreviewRow.test.tsx', 70, 'JSONPath 结果预览行测试只锁定路径来源值展示、点击下标和结构定位入口'),
  appJsonPathComponentTestCoreBudget('frontend/src/components/JsonPathPanelResultToolbar.test.tsx', 75, 'JSONPath 结果工具条测试只锁定状态文案、工具按钮接线和查询中禁用态'),
];
