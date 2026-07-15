const appJsonPathHelperCoreBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const appJsonPathHelperCoreMaintainabilityBudgets = [
  appJsonPathHelperCoreBudget('frontend/src/utils/jsonPathSegments.ts', 30, 'JSONPath segment helper 只维护标识符判断、对象键 segment 和数组下标拼接'),
  appJsonPathHelperCoreBudget('frontend/src/utils/jsonPathSegments.test.ts', 60, 'JSONPath segment 测试只锁定特殊键转义、可执行性和数组下标语义'),
  appJsonPathHelperCoreBudget('frontend/src/utils/jsonValueGuards.ts', 60, 'JSON 值守卫统一对象节点窄化与迭代未知值校验'),
  appJsonPathHelperCoreBudget('frontend/src/utils/jsonValueGuards.test.ts', 55, 'JSON 值守卫测试锁定标量、容器、循环与深层输入边界'),
  appJsonPathHelperCoreBudget('frontend/src/utils/jsonPathPanelCopy.ts', 35, 'JSONPath 面板复制 helper 只维护查询值、路径和值和数量文案格式化'),
  appJsonPathHelperCoreBudget('frontend/src/utils/jsonPathPanelCopy.test.ts', 60, 'JSONPath 面板复制测试只锁定字符串、结构化值、多结果、路径行和值数量文案'),
  appJsonPathHelperCoreBudget('frontend/src/utils/jsonPathPanelPreviewItems.ts', 45, 'JSONPath 面板预览项 helper 只维护可见结果裁剪、紧凑文本和预览行展示文案映射'),
  appJsonPathHelperCoreBudget('frontend/src/utils/jsonPathPanelPreviewItems.test.ts', 75, 'JSONPath 面板预览项测试只锁定 sourceLabel、紧凑文本、展示文案和可见上限裁剪'),
  appJsonPathHelperCoreBudget('frontend/src/utils/jsonPathPanelNavigation.ts', 45, 'JSONPath 面板导航 helper 只维护结果前后切换和聚焦索引边界'),
  appJsonPathHelperCoreBudget('frontend/src/utils/jsonPathPanelNavigation.test.ts', 85, 'JSONPath 面板导航测试只锁定循环导航、禁用态和聚焦索引边界'),
  appJsonPathHelperCoreBudget('frontend/src/hooks/useJsonPathPanelTour.ts', 35, 'JSONPath 面板引导 hook 只维护首次打开引导和打开后刷新位置'),
  appJsonPathHelperCoreBudget('frontend/src/hooks/useJsonPathPanelTour.test.ts', 65, 'JSONPath 面板引导 hook 测试只锁定首次打开、重复打开和关闭态'),
  appJsonPathHelperCoreBudget('frontend/src/utils/jsonPathPanelPresets.ts', 25, 'JSONPath 面板 preset 常量只维护默认示例和 Response 常用查询'),
];
