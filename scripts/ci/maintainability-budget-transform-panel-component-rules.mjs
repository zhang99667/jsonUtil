import { transformPanelShellComponentMaintainabilityBudgets } from './maintainability-budget-transform-panel-shell-component-rules.mjs';

export const transformPanelComponentMaintainabilityBudgets = [
  ...transformPanelShellComponentMaintainabilityBudgets,
  {
    file: 'frontend/src/components/TransformReportCmdComparisonPanel.tsx',
    maxLines: 220,
    reason: 'cmdHandler 对比面板应保持专用 UI 组件，状态编排留在报告主面板',
  },
  {
    file: 'frontend/src/components/TransformReportPanelAtoms.tsx',
    maxLines: 100,
    reason: '深度解析报告展示 atom 应保持轻量，复杂交互留在主面板或专用组件',
  },
  {
    file: 'frontend/src/components/TransformReportPanelFooter.tsx',
    maxLines: 60,
    reason: '深度解析报告 footer 渲染只承接按钮列表和摘要，行为编排留在报告主面板',
  },
  {
    file: 'frontend/src/components/TransformReportFilterBar.tsx',
    maxLines: 50,
    reason: '深度解析报告筛选条应保持无状态 UI 组件，筛选逻辑留在报告主面板',
  },
];
