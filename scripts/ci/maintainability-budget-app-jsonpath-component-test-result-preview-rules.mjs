const appJsonPathComponentTestResultPreviewBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const appJsonPathComponentTestResultPreviewMaintainabilityBudgets = [
  appJsonPathComponentTestResultPreviewBudget('frontend/src/components/JsonPathPanelResultPreview.test.tsx', 85, 'JSONPath 结果预览测试只锁定空态、结果列表装配和提示状态透传'),
  appJsonPathComponentTestResultPreviewBudget('frontend/src/components/JsonPathPanelResultPreviewList.test.tsx', 65, 'JSONPath 结果预览列表测试只锁定结果行映射、选中态和回调透传'),
  appJsonPathComponentTestResultPreviewBudget('frontend/src/components/JsonPathPanelResultPreviewMessages.test.tsx', 50, 'JSONPath 结果预览提示测试只锁定隐藏结果数量和命中上限文案'),
  appJsonPathComponentTestResultPreviewBudget('frontend/src/components/JsonPathPanelResultPreviewRow.test.tsx', 55, 'JSONPath 结果预览行测试只锁定聚焦按钮状态、点击下标和结构定位入口装配'),
  appJsonPathComponentTestResultPreviewBudget('frontend/src/components/JsonPathPanelResultPreviewRowContent.test.tsx', 55, 'JSONPath 结果预览行内容测试只锁定结果序号、来源、路径和值展示'),
  appJsonPathComponentTestResultPreviewBudget('frontend/src/components/JsonPathPanelResultPreviewLocateButton.test.tsx', 55, 'JSONPath 结果预览结构定位按钮测试只锁定按钮属性、隐藏图标和点击下标'),
  appJsonPathComponentTestResultPreviewBudget('frontend/src/components/JsonPathPanelResultPreviewItemTestData.ts', 50, 'JSONPath 结果预览测试数据只维护默认预览项和列表工厂'),
  appJsonPathComponentTestResultPreviewBudget('frontend/src/components/JsonPathPanelResultPreviewTestFixture.ts', 60, 'JSONPath 结果预览测试夹具只维护容器、列表和行组件渲染 helper'),
];
