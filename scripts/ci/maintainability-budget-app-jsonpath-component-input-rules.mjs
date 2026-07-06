const appJsonPathComponentInputBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const appJsonPathComponentInputMaintainabilityBudgets = [
  appJsonPathComponentInputBudget('frontend/src/components/JsonPathPanelQueryInput.tsx', 65, 'JSONPath 查询输入子组件只维护输入框、收藏入口、查询动作和状态提示装配'),
  appJsonPathComponentInputBudget('frontend/src/components/JsonPathPanelQueryInputField.tsx', 40, 'JSONPath 查询输入框只维护原生输入框属性、输入变化和键盘事件接线'),
  appJsonPathComponentInputBudget('frontend/src/components/JsonPathPanelQueryActionButtons.tsx', 40, 'JSONPath 查询动作按钮只维护运行按钮和取消按钮装配'),
  appJsonPathComponentInputBudget('frontend/src/components/JsonPathPanelQueryRunButton.tsx', 45, 'JSONPath 查询运行按钮只维护查询按钮状态、隐藏说明和无障碍关联'),
  appJsonPathComponentInputBudget('frontend/src/components/JsonPathPanelQueryCancelButton.tsx', 35, 'JSONPath 查询取消按钮只维护取消入口样式、文案和点击回调'),
  appJsonPathComponentInputBudget('frontend/src/components/JsonPathPanelQueryStatus.tsx', 35, 'JSONPath 查询状态提示只维护查询中、已取消和空闲隐藏渲染'),
  appJsonPathComponentInputBudget('frontend/src/components/JsonPathPanelFavoriteToggleButton.tsx', 45, 'JSONPath 收藏按钮只维护星标状态、按钮样式和无障碍标签'),
];
