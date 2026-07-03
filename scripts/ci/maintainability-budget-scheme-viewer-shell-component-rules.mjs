import { schemeViewerShellTestMaintainabilityBudgets } from './maintainability-budget-scheme-viewer-shell-test-rules.mjs';

const schemeViewerShellComponentBudget = (file, maxLines, reason) => ({
  file: `frontend/src/components/${file}`,
  maxLines,
  reason,
});

export const schemeViewerShellComponentMaintainabilityBudgets = [
  schemeViewerShellComponentBudget(
    'SchemeViewerModal.tsx',
    1220,
    'Scheme 弹窗主组件应继续拆出纯展示面板、worker helper 和状态 helper，避免诊断 UI 继续回流主文件'
  ),
  schemeViewerShellComponentBudget(
    'SchemeViewerFooterActions.tsx',
    200,
    'Scheme 弹窗底部操作栏只负责按钮显示条件和回调透传，按钮壳、复制、二维码和应用逻辑不得回流'
  ),
  schemeViewerShellComponentBudget(
    'SchemeViewerFooterActionButton.tsx',
    70,
    'Scheme 弹窗底部按钮壳只维护共享样式、图标壳、禁用态和 aria/title 透传'
  ),
  schemeViewerShellComponentBudget(
    'SchemeViewerBase64MetaPanel.tsx',
    55,
    'Scheme 内部 Base64 元信息面板只负责布局和 badge 渲染，展示模型与格式化规则应留在 utils'
  ),
  schemeViewerShellComponentBudget(
    'SchemeViewerRuntimePlaceholdersPanel.tsx',
    85,
    'Scheme 运行时占位符面板只负责分组和路径明细展示，采集规则留在 Scheme 解析层'
  ),
  ...schemeViewerShellTestMaintainabilityBudgets,
];
