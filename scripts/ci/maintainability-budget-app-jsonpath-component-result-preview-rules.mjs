const appJsonPathComponentResultPreviewBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const appJsonPathComponentResultPreviewMaintainabilityBudgets = [
  appJsonPathComponentResultPreviewBudget('frontend/src/components/JsonPathPanelResultPreview.tsx', 65, 'JSONPath 结果预览子组件只维护可见结果列表、滚动容器和提示组件装配'),
  appJsonPathComponentResultPreviewBudget('frontend/src/components/JsonPathPanelResultPreviewList.tsx', 50, 'JSONPath 结果预览列表只维护结果行映射、选中态和交互回调透传'),
  appJsonPathComponentResultPreviewBudget('frontend/src/components/JsonPathPanelResultPreviewMessages.tsx', 45, 'JSONPath 结果预览提示只维护隐藏结果数量和命中上限提示渲染'),
  appJsonPathComponentResultPreviewBudget('frontend/src/components/JsonPathPanelResultPreviewRow.tsx', 50, 'JSONPath 结果预览行只维护选中态、聚焦按钮和结构定位入口装配'),
  appJsonPathComponentResultPreviewBudget('frontend/src/components/JsonPathPanelResultPreviewRowContent.tsx', 45, 'JSONPath 结果预览行内容只维护结果序号、来源、路径和值展示'),
  appJsonPathComponentResultPreviewBudget('frontend/src/components/JsonPathPanelResultPreviewLocateButton.tsx', 40, 'JSONPath 结果预览结构定位按钮只维护定位入口样式、标题、无障碍标签和点击下标'),
];
