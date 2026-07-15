const schemeViewerShellSupportTestBudget = (file, maxLines, reason) => ({
  file: `frontend/src/components/${file}`,
  maxLines,
  reason,
});

export const schemeViewerShellSupportTestMaintainabilityBudgets = [
  schemeViewerShellSupportTestBudget('componentElementTestHelpers.ts', 70, '组件测试 React 树 helper 只负责元素断言、文本收集和按 data-tour/type 查找'),
  schemeViewerShellSupportTestBudget('schemeViewerElementTestHelpers.ts', 20, 'Scheme Viewer 测试 React 树 helper 只保留兼容导出，通用实现沉到组件测试 helper'),
  schemeViewerShellSupportTestBudget('schemeViewerRenderedElementTestHelpers.ts', 45, 'Scheme Viewer rendered 测试 helper 只负责显式渲染无 Hook 函数组件后的文本收集和 data-tour 查找'),
  schemeViewerShellSupportTestBudget('SchemeViewerBase64MetaPanel.test.tsx', 75, 'Scheme 内部 Base64 元信息面板测试只覆盖展示截断、数量和空态'),
  schemeViewerShellSupportTestBudget('SchemeViewerRuntimePlaceholdersPanel.test.tsx', 95, 'Scheme 运行时占位符面板测试只覆盖空态、分组、明细上限和预览截断'),
];
