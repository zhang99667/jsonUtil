const appJsonPathComponentCoreBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const appJsonPathComponentCoreMaintainabilityBudgets = [
  appJsonPathComponentCoreBudget('frontend/src/components/JsonPathPanel.tsx', 630, 'JSONPath 面板组件继续承载 worker、面板状态和区域装配，复制格式化、结果工具条、预览项派生、结果预览、导航、查询建议、查询输入、保存查询、状态提示和标题文案等逻辑应下沉到 helper/子组件'),
  appJsonPathComponentCoreBudget('frontend/src/components/JsonPathPanelQueryInput.tsx', 110, 'JSONPath 查询输入子组件只维护输入框、收藏入口、查询/取消按钮和查询状态提示渲染'),
  appJsonPathComponentCoreBudget('frontend/src/components/JsonPathPanelFavoriteToggleButton.tsx', 45, 'JSONPath 收藏按钮只维护星标状态、按钮样式和无障碍标签'),
  appJsonPathComponentCoreBudget('frontend/src/components/JsonPathPanelResultPreview.tsx', 120, 'JSONPath 结果预览子组件只维护可见结果行、结构定位入口和命中上限提示渲染'),
  appJsonPathComponentCoreBudget('frontend/src/components/JsonPathPanelResultToolbar.tsx', 110, 'JSONPath 结果工具条子组件只维护结果计数、复制按钮和前后导航按钮渲染'),
  appJsonPathComponentCoreBudget('frontend/src/components/JsonPathPanelResultToolbarButton.tsx', 35, 'JSONPath 结果工具条按钮壳只维护图标按钮样式、标题和无障碍标签'),
];
