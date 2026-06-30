export const appEditorPreviewMaintainabilityBudgets = [
  {
    file: 'frontend/src/components/AppPreviewEditorPane.tsx',
    maxLines: 25,
    reason: 'PREVIEW 编辑 pane 只负责右侧编辑器容器和 PREVIEW CodeEditor 装配',
  },
  {
    file: 'frontend/src/components/AppPreviewCodeEditor.tsx',
    maxLines: 90,
    reason: 'PREVIEW CodeEditor 只负责结果编辑器校验、提示、高亮和头部动作装配',
  },
];
