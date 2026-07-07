const appJsonPathComponentTestResultPreviewRowBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const appJsonPathComponentTestResultPreviewRowMaintainabilityBudgets = [
  appJsonPathComponentTestResultPreviewRowBudget('frontend/src/components/JsonPathPanelResultPreviewRow.test.tsx', 55, 'JSONPath 结果预览行测试只锁定聚焦按钮装配和结构定位入口装配'),
  appJsonPathComponentTestResultPreviewRowBudget('frontend/src/components/JsonPathPanelResultPreviewRowClassName.test.ts', 45, 'JSONPath 结果预览行 className 测试只锁定基础布局、选中态和悬停态样式派生'),
  appJsonPathComponentTestResultPreviewRowBudget('frontend/src/components/JsonPathPanelResultPreviewFocusButton.test.tsx', 55, 'JSONPath 结果预览聚焦按钮测试只锁定按钮属性、结果内容和点击下标'),
  appJsonPathComponentTestResultPreviewRowBudget('frontend/src/components/JsonPathPanelResultPreviewRowContent.test.tsx', 55, 'JSONPath 结果预览行内容测试只锁定结果序号、来源、路径和值展示'),
  appJsonPathComponentTestResultPreviewRowBudget('frontend/src/components/JsonPathPanelResultPreviewLocateButton.test.tsx', 55, 'JSONPath 结果预览结构定位按钮测试只锁定按钮属性、隐藏图标和点击下标'),
];
