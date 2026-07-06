const appJsonPathBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const appJsonPathMaintainabilityBudgets = [
  appJsonPathBudget('frontend/src/components/JsonPathPanel.tsx', 965, 'JSONPath 面板组件继续承载 UI、worker 和面板状态，复制格式化、预览项派生和标题文案等纯逻辑应下沉到 helper'),
  appJsonPathBudget('frontend/src/utils/jsonPathPanelCopy.ts', 35, 'JSONPath 面板复制 helper 只维护查询值、路径和值和数量文案格式化'),
  appJsonPathBudget('frontend/src/utils/jsonPathPanelCopy.test.ts', 60, 'JSONPath 面板复制测试只锁定字符串、结构化值、多结果、路径行和值数量文案'),
  appJsonPathBudget('frontend/src/utils/jsonPathPanelPreviewItems.ts', 35, 'JSONPath 面板预览项 helper 只维护可见结果裁剪和紧凑文本映射'),
  appJsonPathBudget('frontend/src/utils/jsonPathPanelPreviewItems.test.ts', 65, 'JSONPath 面板预览项测试只锁定 sourceLabel、紧凑文本和可见上限裁剪'),
  appJsonPathBudget('frontend/src/utils/jsonPathPanelUiState.ts', 95, 'JSONPath 面板 UI 状态 helper 只维护按钮标题、空态开关、复制文案和描述 ID 派生'),
  appJsonPathBudget('frontend/src/utils/jsonPathPanelUiState.test.ts', 95, 'JSONPath 面板 UI 状态测试只锁定标题文案、空态、取消态、描述 ID 和复制文案矩阵'),
];
