const appJsonPathComponentCoreBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const appJsonPathComponentCoreMaintainabilityBudgets = [
  appJsonPathComponentCoreBudget('frontend/src/components/JsonPathPanel.tsx', 630, 'JSONPath 面板组件继续承载 worker、面板状态和区域装配，复制格式化、结果工具条、预览项派生、结果预览、导航、查询建议、查询输入、保存查询、状态提示和标题文案等逻辑应下沉到 helper/子组件'),
  appJsonPathComponentCoreBudget('frontend/src/components/JsonPathPanelResultPreview.tsx', 65, 'JSONPath 结果预览子组件只维护可见结果列表、滚动容器和提示组件装配'),
  appJsonPathComponentCoreBudget('frontend/src/components/JsonPathPanelResultPreviewMessages.tsx', 45, 'JSONPath 结果预览提示只维护隐藏结果数量和命中上限提示渲染'),
  appJsonPathComponentCoreBudget('frontend/src/components/JsonPathPanelResultPreviewRow.tsx', 67, 'JSONPath 结果预览行只维护单条路径和值展示、选中态和结构定位入口装配'),
  appJsonPathComponentCoreBudget('frontend/src/components/JsonPathPanelResultPreviewLocateButton.tsx', 40, 'JSONPath 结果预览结构定位按钮只维护定位入口样式、标题、无障碍标签和点击下标'),
  appJsonPathComponentCoreBudget('frontend/src/components/JsonPathPanelResultToolbar.tsx', 70, 'JSONPath 结果工具条子组件只维护结果计数、命中上限和动作列表装配'),
  appJsonPathComponentCoreBudget('frontend/src/components/JsonPathPanelResultToolbarActionList.tsx', 85, 'JSONPath 结果工具条动作列表只维护按钮配置、图标映射和按钮壳装配'),
  appJsonPathComponentCoreBudget('frontend/src/components/JsonPathPanelResultToolbarButton.tsx', 35, 'JSONPath 结果工具条按钮壳只维护图标按钮样式、标题和无障碍标签'),
];
