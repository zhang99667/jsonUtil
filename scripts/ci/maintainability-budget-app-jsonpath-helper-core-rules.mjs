const appJsonPathHelperCoreBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const appJsonPathHelperCoreMaintainabilityBudgets = [
  appJsonPathHelperCoreBudget('frontend/src/utils/jsonPathPanelCopy.ts', 35, 'JSONPath 面板复制 helper 只维护查询值、路径和值和数量文案格式化'),
  appJsonPathHelperCoreBudget('frontend/src/utils/jsonPathPanelCopy.test.ts', 60, 'JSONPath 面板复制测试只锁定字符串、结构化值、多结果、路径行和值数量文案'),
  appJsonPathHelperCoreBudget('frontend/src/utils/jsonPathPanelPreviewItems.ts', 45, 'JSONPath 面板预览项 helper 只维护可见结果裁剪、紧凑文本和预览行展示文案映射'),
  appJsonPathHelperCoreBudget('frontend/src/utils/jsonPathPanelPreviewItems.test.ts', 75, 'JSONPath 面板预览项测试只锁定 sourceLabel、紧凑文本、展示文案和可见上限裁剪'),
  appJsonPathHelperCoreBudget('frontend/src/utils/jsonPathPanelUiState.ts', 75, 'JSONPath 面板 UI 状态 helper 只维护空态开关、复制文案和标题 helper 装配'),
  appJsonPathHelperCoreBudget('frontend/src/utils/jsonPathPanelUiState.test.ts', 65, 'JSONPath 面板 UI 状态测试只锁定空态、取消态、复制文案和标题 helper 装配'),
  appJsonPathHelperCoreBudget('frontend/src/utils/jsonPathPanelUiTitles.ts', 55, 'JSONPath 面板标题 helper 只维护收藏、查询按钮和输入描述 ID 文案决策'),
  appJsonPathHelperCoreBudget('frontend/src/utils/jsonPathPanelUiTitles.test.ts', 70, 'JSONPath 面板标题测试只锁定收藏、查询前置状态和描述 ID 文案矩阵'),
  appJsonPathHelperCoreBudget('frontend/src/utils/jsonPathPanelNavigation.ts', 45, 'JSONPath 面板导航 helper 只维护结果前后切换和聚焦索引边界'),
  appJsonPathHelperCoreBudget('frontend/src/utils/jsonPathPanelNavigation.test.ts', 85, 'JSONPath 面板导航测试只锁定循环导航、禁用态和聚焦索引边界'),
  appJsonPathHelperCoreBudget('frontend/src/hooks/useJsonPathPanelTour.ts', 35, 'JSONPath 面板引导 hook 只维护首次打开引导和打开后刷新位置'),
  appJsonPathHelperCoreBudget('frontend/src/hooks/useJsonPathPanelTour.test.ts', 65, 'JSONPath 面板引导 hook 测试只锁定首次打开、重复打开和关闭态'),
  appJsonPathHelperCoreBudget('frontend/src/utils/jsonPathPanelPresets.ts', 25, 'JSONPath 面板 preset 常量只维护默认示例和 Response 常用查询'),
];
