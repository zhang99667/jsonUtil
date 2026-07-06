const appJsonPathBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const appJsonPathMaintainabilityBudgets = [
  appJsonPathBudget('frontend/src/components/JsonPathPanel.tsx', 630, 'JSONPath 面板组件继续承载 worker、面板状态和区域装配，复制格式化、结果工具条、预览项派生、结果预览、导航、查询建议、查询输入、保存查询、状态提示和标题文案等逻辑应下沉到 helper/子组件'),
  appJsonPathBudget('frontend/src/components/JsonPathPanelQueryInput.tsx', 125, 'JSONPath 查询输入子组件只维护输入框、收藏按钮、查询/取消按钮和查询状态提示渲染'),
  appJsonPathBudget('frontend/src/components/JsonPathPanelResultPreview.tsx', 120, 'JSONPath 结果预览子组件只维护可见结果行、结构定位入口和命中上限提示渲染'),
  appJsonPathBudget('frontend/src/components/JsonPathPanelResultToolbar.tsx', 125, 'JSONPath 结果工具条子组件只维护结果计数、复制按钮和前后导航按钮渲染'),
  appJsonPathBudget('frontend/src/components/JsonPathPanelSavedQueries.tsx', 180, 'JSONPath 保存查询子组件只维护收藏、历史、删除入口和历史自定义滚动条渲染'),
  appJsonPathBudget('frontend/src/components/JsonPathPanelStatusMessages.tsx', 75, 'JSONPath 状态提示子组件只维护查询错误和空结果提示渲染'),
  appJsonPathBudget('frontend/src/components/JsonPathPanelSuggestions.tsx', 85, 'JSONPath 查询建议子组件只维护常用示例、场景示例和 Response preset 的按钮渲染'),
  appJsonPathBudget('frontend/src/utils/jsonPathPanelCopy.ts', 35, 'JSONPath 面板复制 helper 只维护查询值、路径和值和数量文案格式化'),
  appJsonPathBudget('frontend/src/utils/jsonPathPanelCopy.test.ts', 60, 'JSONPath 面板复制测试只锁定字符串、结构化值、多结果、路径行和值数量文案'),
  appJsonPathBudget('frontend/src/utils/jsonPathPanelPreviewItems.ts', 35, 'JSONPath 面板预览项 helper 只维护可见结果裁剪和紧凑文本映射'),
  appJsonPathBudget('frontend/src/utils/jsonPathPanelPreviewItems.test.ts', 65, 'JSONPath 面板预览项测试只锁定 sourceLabel、紧凑文本和可见上限裁剪'),
  appJsonPathBudget('frontend/src/utils/jsonPathPanelUiState.ts', 95, 'JSONPath 面板 UI 状态 helper 只维护按钮标题、空态开关、复制文案和描述 ID 派生'),
  appJsonPathBudget('frontend/src/utils/jsonPathPanelUiState.test.ts', 95, 'JSONPath 面板 UI 状态测试只锁定标题文案、空态、取消态、描述 ID 和复制文案矩阵'),
  appJsonPathBudget('frontend/src/utils/jsonPathPanelNavigation.ts', 45, 'JSONPath 面板导航 helper 只维护结果前后切换和聚焦索引边界'),
  appJsonPathBudget('frontend/src/utils/jsonPathPanelNavigation.test.ts', 85, 'JSONPath 面板导航测试只锁定循环导航、禁用态和聚焦索引边界'),
  appJsonPathBudget('frontend/src/utils/jsonPathPanelPresets.ts', 25, 'JSONPath 面板 preset 常量只维护默认示例和 Response 常用查询'),
];
