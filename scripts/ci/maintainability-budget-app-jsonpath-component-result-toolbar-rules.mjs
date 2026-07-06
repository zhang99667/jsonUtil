const appJsonPathComponentResultToolbarBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const appJsonPathComponentResultToolbarMaintainabilityBudgets = [
  appJsonPathComponentResultToolbarBudget('frontend/src/components/JsonPathPanelResultToolbar.tsx', 50, 'JSONPath 结果工具条子组件只维护空态判断、结果状态和动作列表装配'),
  appJsonPathComponentResultToolbarBudget('frontend/src/components/JsonPathPanelResultToolbarStatus.tsx', 45, 'JSONPath 结果工具条状态只维护结果计数、命中上限提示和无障碍 status 语义'),
  appJsonPathComponentResultToolbarBudget('frontend/src/components/JsonPathPanelResultToolbarActionList.tsx', 35, 'JSONPath 结果工具条动作列表只维护按钮壳和图标装配'),
  appJsonPathComponentResultToolbarBudget('frontend/src/components/JsonPathPanelResultToolbarActionItems.ts', 55, 'JSONPath 结果工具条动作配置只维护按钮顺序、禁用态和回调映射'),
  appJsonPathComponentResultToolbarBudget('frontend/src/components/JsonPathPanelResultToolbarIcon.tsx', 45, 'JSONPath 结果工具条图标只维护图标路径映射和统一 SVG 外壳'),
  appJsonPathComponentResultToolbarBudget('frontend/src/components/JsonPathPanelResultToolbarButton.tsx', 35, 'JSONPath 结果工具条按钮壳只维护图标按钮样式、标题和无障碍标签'),
];
