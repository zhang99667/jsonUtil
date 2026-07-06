const appJsonPathComponentBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const appJsonPathComponentMaintainabilityBudgets = [
  appJsonPathComponentBudget('frontend/src/components/JsonPathPanel.tsx', 630, 'JSONPath 面板组件继续承载 worker、面板状态和区域装配，复制格式化、结果工具条、预览项派生、结果预览、导航、查询建议、查询输入、保存查询、状态提示和标题文案等逻辑应下沉到 helper/子组件'),
  appJsonPathComponentBudget('frontend/src/components/JsonPathPanelQueryInput.tsx', 125, 'JSONPath 查询输入子组件只维护输入框、收藏按钮、查询/取消按钮和查询状态提示渲染'),
  appJsonPathComponentBudget('frontend/src/components/JsonPathPanelResultPreview.tsx', 120, 'JSONPath 结果预览子组件只维护可见结果行、结构定位入口和命中上限提示渲染'),
  appJsonPathComponentBudget('frontend/src/components/JsonPathPanelResultToolbar.tsx', 125, 'JSONPath 结果工具条子组件只维护结果计数、复制按钮和前后导航按钮渲染'),
  appJsonPathComponentBudget('frontend/src/components/JsonPathPanelSavedQueries.tsx', 180, 'JSONPath 保存查询子组件只维护收藏、历史、删除入口和历史自定义滚动条渲染'),
  appJsonPathComponentBudget('frontend/src/components/JsonPathPanelStatusMessages.tsx', 75, 'JSONPath 状态提示子组件只维护查询错误和空结果提示渲染'),
  appJsonPathComponentBudget('frontend/src/components/JsonPathPanelSuggestions.tsx', 85, 'JSONPath 查询建议子组件只维护常用示例、场景示例和 Response preset 的按钮渲染'),
];
