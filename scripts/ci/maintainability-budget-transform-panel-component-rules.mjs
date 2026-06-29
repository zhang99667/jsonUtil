export const transformPanelComponentMaintainabilityBudgets = [
  {
    file: 'frontend/src/components/TransformReportPanel.tsx',
    maxLines: 830,
    reason: '深度解析报告 UI 复杂度较高，新增视图应优先拆组件或纯 helper，顶部总览、空态、Top 分布、展开记录、未展开线索、运行时占位符和跳过记录展示不得回流',
  },
  {
    file: 'frontend/src/components/TransformReportTopDistributions.tsx',
    maxLines: 180,
    reason: '深度解析报告 Top 分布按钮应保持纯展示组件，筛选状态留在主面板',
  },
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
