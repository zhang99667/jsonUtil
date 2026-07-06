const appJsonPathComponentTestBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const appJsonPathComponentTestMaintainabilityBudgets = [
  appJsonPathComponentTestBudget('frontend/src/components/JsonPathPanelFavoriteToggleButton.test.tsx', 55, 'JSONPath 收藏按钮测试只锁定空心/实心星标、禁用态和可访问文案'),
  appJsonPathComponentTestBudget('frontend/src/components/JsonPathPanelResultPreviewRow.test.tsx', 70, 'JSONPath 结果预览行测试只锁定路径来源值展示、点击下标和结构定位入口'),
  appJsonPathComponentTestBudget('frontend/src/components/JsonPathPanelResultToolbar.test.tsx', 75, 'JSONPath 结果工具条测试只锁定状态文案、工具按钮接线和查询中禁用态'),
  appJsonPathComponentTestBudget('frontend/src/components/JsonPathPanelSavedQueryList.test.tsx', 65, 'JSONPath 保存查询列表测试只锁定列表容器、行 props 和选择删除回调'),
];
