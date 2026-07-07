const appJsonPathComponentTestResultPreviewCoreBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const appJsonPathComponentTestResultPreviewCoreMaintainabilityBudgets = [
  appJsonPathComponentTestResultPreviewCoreBudget('frontend/src/components/JsonPathPanelResultPreview.test.tsx', 60, 'JSONPath 结果预览测试只锁定空态、外框装配、结果列表装配和提示状态透传'),
  appJsonPathComponentTestResultPreviewCoreBudget('frontend/src/components/JsonPathPanelResultPreviewFrame.test.tsx', 45, 'JSONPath 结果预览外框测试只锁定滚轮事件、滚动样式和子内容透传'),
  appJsonPathComponentTestResultPreviewCoreBudget('frontend/src/components/JsonPathPanelResultPreviewList.test.tsx', 65, 'JSONPath 结果预览列表测试只锁定结果行映射、选中态和回调透传'),
  appJsonPathComponentTestResultPreviewCoreBudget('frontend/src/components/JsonPathPanelResultPreviewMessages.test.tsx', 50, 'JSONPath 结果预览提示测试只锁定隐藏结果数量和命中上限文案'),
];
