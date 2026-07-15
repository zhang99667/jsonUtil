import { appEditorSchemeMaintainabilityBudgets } from './maintainability-budget-app-editor-scheme-rules.mjs';

export const appEditorMaintainabilityBudgets = [
  {
    file: 'frontend/src/components/AppEditorWorkspace.tsx',
    maxLines: 165,
    reason: '主工作台编辑区外壳只装配 AI 修复摘要和 SOURCE/PREVIEW pane，分栏布局细节应留在 AppEditorSplitPanes',
  },
  {
    file: 'frontend/src/components/AppEditorSplitPanes.tsx',
    maxLines: 45,
    reason: '编辑区分栏布局只负责 SOURCE/PREVIEW 容器和 resize handle 装配，不承载编辑器业务状态',
  },
  {
    file: 'frontend/src/components/AppAiRepairSummarySlot.tsx',
    maxLines: 45,
    reason: 'AI 修复摘要槽位只负责懒加载摘要条和事件透传，不承载修复业务逻辑',
  },
  ...appEditorSchemeMaintainabilityBudgets,
];
