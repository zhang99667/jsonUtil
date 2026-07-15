import { schemeViewerShellTestMaintainabilityBudgets } from './maintainability-budget-scheme-viewer-shell-test-rules.mjs';

const schemeViewerShellComponentBudget = (file, maxLines, reason) => ({
  file: `frontend/src/components/${file}`,
  maxLines,
  reason,
});

export const schemeViewerShellComponentMaintainabilityBudgets = [
  schemeViewerShellComponentBudget(
    'SchemeViewerModal.tsx',
    850,
    'Scheme 弹窗主组件只负责编辑、复制和子面板组装，后台解码与二维码容量规则不得回流'
  ),
  schemeViewerShellComponentBudget(
    'SchemeViewerQRCodePanel.tsx',
    165,
    'Scheme 二维码面板只负责类型切换、容量提示和下载入口，字节与 Unicode 边界留在纯函数'
  ),
  schemeViewerShellComponentBudget(
    'SchemeViewerFooterActions.tsx',
    55,
    'Scheme 弹窗底部外壳只负责状态文字、关闭按钮和动作列表装配，动作显隐和图标不得回流'
  ),
  schemeViewerShellComponentBudget(
    'SchemeViewerFooterActionList.tsx',
    35,
    'Scheme 弹窗底部动作列表只负责过滤并渲染动作 item，动作定义不得回流'
  ),
  schemeViewerShellComponentBudget(
    'schemeViewerFooterActionItems.tsx',
    180,
    'Scheme 弹窗底部动作 item builder 只负责动作显隐、禁用态、tone 与 aria/title 透传'
  ),
  schemeViewerShellComponentBudget(
    'SchemeViewerFooterActionIcons.tsx',
    40,
    'Scheme 弹窗底部动作图标只保存现有 SVG 片段，避免图标噪音撑大动作列表'
  ),
  schemeViewerShellComponentBudget(
    'SchemeViewerFooterActionButton.tsx',
    65,
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
