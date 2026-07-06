const appJsonPathHelperBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const appJsonPathHelperMaintainabilityBudgets = [
  appJsonPathHelperBudget('frontend/src/utils/jsonPathPanelCopy.ts', 35, 'JSONPath 面板复制 helper 只维护查询值、路径和值和数量文案格式化'),
  appJsonPathHelperBudget('frontend/src/utils/jsonPathPanelCopy.test.ts', 60, 'JSONPath 面板复制测试只锁定字符串、结构化值、多结果、路径行和值数量文案'),
  appJsonPathHelperBudget('frontend/src/utils/jsonPathPanelPreviewItems.ts', 35, 'JSONPath 面板预览项 helper 只维护可见结果裁剪和紧凑文本映射'),
  appJsonPathHelperBudget('frontend/src/utils/jsonPathPanelPreviewItems.test.ts', 65, 'JSONPath 面板预览项测试只锁定 sourceLabel、紧凑文本和可见上限裁剪'),
  appJsonPathHelperBudget('frontend/src/utils/jsonPathPanelUiState.ts', 95, 'JSONPath 面板 UI 状态 helper 只维护按钮标题、空态开关、复制文案和描述 ID 派生'),
  appJsonPathHelperBudget('frontend/src/utils/jsonPathPanelUiState.test.ts', 95, 'JSONPath 面板 UI 状态测试只锁定标题文案、空态、取消态、描述 ID 和复制文案矩阵'),
  appJsonPathHelperBudget('frontend/src/utils/jsonPathPanelNavigation.ts', 45, 'JSONPath 面板导航 helper 只维护结果前后切换和聚焦索引边界'),
  appJsonPathHelperBudget('frontend/src/utils/jsonPathPanelNavigation.test.ts', 85, 'JSONPath 面板导航测试只锁定循环导航、禁用态和聚焦索引边界'),
  appJsonPathHelperBudget('frontend/src/hooks/useJsonPathSavedQueryLists.ts', 95, 'JSONPath 保存查询 hook 只维护收藏/历史初始化、持久化和增删操作'),
  appJsonPathHelperBudget('frontend/src/hooks/useJsonPathSavedQueryLists.test.ts', 125, 'JSONPath 保存查询 hook 测试只锁定初始化持久化、导入刷新和列表 updater'),
  appJsonPathHelperBudget('frontend/src/hooks/useJsonPathPanelTour.ts', 35, 'JSONPath 面板引导 hook 只维护首次打开引导和打开后刷新位置'),
  appJsonPathHelperBudget('frontend/src/hooks/useJsonPathPanelTour.test.ts', 65, 'JSONPath 面板引导 hook 测试只锁定首次打开、重复打开和关闭态'),
  appJsonPathHelperBudget('frontend/src/utils/jsonPathSavedQueryListActions.ts', 55, 'JSONPath 保存查询列表 action helper 只维护历史和收藏的纯状态转移'),
  appJsonPathHelperBudget('frontend/src/utils/jsonPathSavedQueryListActions.test.ts', 65, 'JSONPath 保存查询列表 action 测试只锁定历史收藏增删和切换'),
  appJsonPathHelperBudget('frontend/src/utils/jsonPathSavedQueryStorage.ts', 55, 'JSONPath 保存查询 storage helper 只维护历史收藏读写、清理和导入归一化'),
  appJsonPathHelperBudget('frontend/src/utils/jsonPathSavedQueryStorage.test.ts', 90, 'JSONPath 保存查询 storage 测试只锁定 storage key、数组格式和导入归一化'),
  appJsonPathHelperBudget('frontend/src/utils/jsonPathPanelPresets.ts', 25, 'JSONPath 面板 preset 常量只维护默认示例和 Response 常用查询'),
];
