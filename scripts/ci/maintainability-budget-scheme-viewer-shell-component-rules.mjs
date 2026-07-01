const schemeViewerShellComponentBudget = (file, maxLines, reason) => ({
  file: `frontend/src/components/${file}`,
  maxLines,
  reason,
});

export const schemeViewerShellComponentMaintainabilityBudgets = [
  schemeViewerShellComponentBudget(
    'SchemeViewerModal.tsx',
    1320,
    'Scheme 弹窗主组件应继续拆出纯展示面板、worker helper 和状态 helper，避免诊断 UI 继续回流主文件'
  ),
  schemeViewerShellComponentBudget(
    'SchemeViewerBase64MetaPanel.tsx',
    80,
    'Scheme 内部 Base64 元信息面板只负责只读展示，提取和格式化规则应留在 utils'
  ),
  schemeViewerShellComponentBudget(
    'SchemeViewerBase64MetaPanel.test.tsx',
    110,
    'Scheme 内部 Base64 元信息面板测试只覆盖展示截断、数量和空态'
  ),
  schemeViewerShellComponentBudget(
    'SchemeViewerRuntimePlaceholdersPanel.tsx',
    85,
    'Scheme 运行时占位符面板只负责分组和路径明细展示，采集规则留在 Scheme 解析层'
  ),
  schemeViewerShellComponentBudget(
    'SchemeViewerRuntimePlaceholdersPanel.test.tsx',
    120,
    'Scheme 运行时占位符面板测试只覆盖空态、分组、明细上限和预览截断'
  ),
];
