const appJsonPathComponentTestResultBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const appJsonPathComponentTestResultMaintainabilityBudgets = [
  appJsonPathComponentTestResultBudget('frontend/src/components/JsonPathPanelResultPreview.test.tsx', 85, 'JSONPath 结果预览测试只锁定空态、结果行装配和提示状态透传'),
  appJsonPathComponentTestResultBudget('frontend/src/components/JsonPathPanelResultPreviewMessages.test.tsx', 50, 'JSONPath 结果预览提示测试只锁定隐藏结果数量和命中上限文案'),
  appJsonPathComponentTestResultBudget('frontend/src/components/JsonPathPanelResultPreviewRow.test.tsx', 60, 'JSONPath 结果预览行测试只锁定路径来源值展示、点击下标和结构定位入口装配'),
  appJsonPathComponentTestResultBudget('frontend/src/components/JsonPathPanelResultPreviewLocateButton.test.tsx', 55, 'JSONPath 结果预览结构定位按钮测试只锁定按钮属性、隐藏图标和点击下标'),
  appJsonPathComponentTestResultBudget('frontend/src/components/JsonPathPanelResultToolbar.test.tsx', 60, 'JSONPath 结果工具条测试只锁定状态文案和动作列表接线'),
  appJsonPathComponentTestResultBudget('frontend/src/components/JsonPathPanelResultToolbarActionList.test.tsx', 95, 'JSONPath 结果工具条动作列表测试只锁定按钮配置、禁用态、图标和点击接线'),
];
