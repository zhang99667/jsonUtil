const appJsonPathComponentRuntimeBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const appJsonPathComponentRuntimeMaintainabilityBudgets = [
  appJsonPathComponentRuntimeBudget('frontend/src/components/JsonPathPanel.tsx', 630, 'JSONPath 面板组件继续承载 worker、面板状态和区域装配，复制格式化、结果工具条、预览项派生、结果预览、导航、查询建议、查询输入、保存查询、状态提示和标题文案等逻辑应下沉到 helper/子组件'),
  appJsonPathComponentRuntimeBudget('frontend/src/components/JsonPathPanelQueryInput.tsx', 125, 'JSONPath 查询输入子组件只维护输入框、收藏按钮、查询/取消按钮和查询状态提示渲染'),
  appJsonPathComponentRuntimeBudget('frontend/src/components/JsonPathPanelResultPreview.tsx', 120, 'JSONPath 结果预览子组件只维护可见结果行、结构定位入口和命中上限提示渲染'),
  appJsonPathComponentRuntimeBudget('frontend/src/components/JsonPathPanelResultToolbar.tsx', 110, 'JSONPath 结果工具条子组件只维护结果计数、复制按钮和前后导航按钮渲染'),
  appJsonPathComponentRuntimeBudget('frontend/src/components/JsonPathPanelResultToolbarButton.tsx', 35, 'JSONPath 结果工具条按钮壳只维护图标按钮样式、标题和无障碍标签'),
  appJsonPathComponentRuntimeBudget('frontend/src/components/JsonPathPanelSavedQueries.tsx', 115, 'JSONPath 保存查询子组件只维护收藏、历史和历史自定义滚动条装配'),
  appJsonPathComponentRuntimeBudget('frontend/src/components/JsonPathPanelSavedQueryList.tsx', 55, 'JSONPath 保存查询列表组件只维护容器事件、列表映射和行组件装配'),
  appJsonPathComponentRuntimeBudget('frontend/src/components/JsonPathPanelSavedQueryRow.tsx', 70, 'JSONPath 保存查询行组件只维护单条收藏/历史的选择和删除按钮渲染'),
  appJsonPathComponentRuntimeBudget('frontend/src/components/JsonPathPanelStatusMessages.tsx', 75, 'JSONPath 状态提示子组件只维护查询错误和空结果提示渲染'),
  appJsonPathComponentRuntimeBudget('frontend/src/components/JsonPathPanelSuggestions.tsx', 85, 'JSONPath 查询建议子组件只维护常用示例、场景示例和 Response preset 的按钮渲染'),
];
