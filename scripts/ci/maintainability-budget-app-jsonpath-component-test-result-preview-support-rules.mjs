const appJsonPathComponentTestResultPreviewSupportBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const appJsonPathComponentTestResultPreviewSupportMaintainabilityBudgets = [
  appJsonPathComponentTestResultPreviewSupportBudget('frontend/src/components/JsonPathPanelResultPreviewItemTestData.ts', 50, 'JSONPath 结果预览测试数据只维护默认预览项和列表工厂'),
  appJsonPathComponentTestResultPreviewSupportBudget('frontend/src/components/JsonPathPanelResultPreviewTestFixture.ts', 60, 'JSONPath 结果预览测试夹具只维护容器、列表和行组件渲染 helper'),
];
