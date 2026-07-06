const appJsonPathComponentSupportBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const appJsonPathComponentSupportMaintainabilityBudgets = [
  appJsonPathComponentSupportBudget('frontend/src/components/JsonPathPanelSavedQueries.tsx', 115, 'JSONPath 保存查询子组件只维护收藏、历史和历史自定义滚动条装配'),
  appJsonPathComponentSupportBudget('frontend/src/components/JsonPathPanelSavedQueryList.tsx', 55, 'JSONPath 保存查询列表组件只维护容器事件、列表映射和行组件装配'),
  appJsonPathComponentSupportBudget('frontend/src/components/JsonPathPanelSavedQueryRow.tsx', 70, 'JSONPath 保存查询行组件只维护单条收藏/历史的选择和删除按钮渲染'),
  appJsonPathComponentSupportBudget('frontend/src/components/JsonPathPanelStatusMessages.tsx', 75, 'JSONPath 状态提示子组件只维护查询错误和空结果提示渲染'),
  appJsonPathComponentSupportBudget('frontend/src/components/JsonPathPanelSuggestions.tsx', 85, 'JSONPath 查询建议子组件只维护常用示例、场景示例和 Response preset 的按钮渲染'),
];
