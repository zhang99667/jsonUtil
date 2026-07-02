const schemeViewerShellTestBudget = (file, maxLines, reason) => ({
  file: `frontend/src/components/${file}`,
  maxLines,
  reason,
});

export const schemeViewerShellTestMaintainabilityBudgets = [
  schemeViewerShellTestBudget(
    'SchemeViewerFooterActions.test.tsx',
    170,
    'Scheme 弹窗底部操作栏测试只覆盖按钮显隐、禁用态和回调透传'
  ),
  schemeViewerShellTestBudget(
    'schemeViewerElementTestHelpers.ts',
    70,
    'Scheme Viewer 测试 React 树 helper 只负责文本收集和按 data-tour/type 查找'
  ),
  schemeViewerShellTestBudget(
    'SchemeViewerBase64MetaPanel.test.tsx',
    75,
    'Scheme 内部 Base64 元信息面板测试只覆盖展示截断、数量和空态'
  ),
  schemeViewerShellTestBudget(
    'SchemeViewerRuntimePlaceholdersPanel.test.tsx',
    95,
    'Scheme 运行时占位符面板测试只覆盖空态、分组、明细上限和预览截断'
  ),
];
