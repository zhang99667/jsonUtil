export const transformPanelSectionSmallMaintainabilityBudgets = [
  {
    file: 'frontend/src/components/TransformReportEmptyState.tsx',
    maxLines: 35,
    reason: '深度解析报告空态应保持纯展示组件，筛选清空动作由主面板注入',
  },
  {
    file: 'frontend/src/components/TransformReportCoverageCard.tsx',
    maxLines: 30,
    reason: '深度解析报告覆盖率卡片应只负责摘要外壳和覆盖率样式，覆盖项列表由子组件渲染',
  },
  {
    file: 'frontend/src/components/TransformReportCoverageItems.tsx',
    maxLines: 35,
    reason: '深度解析报告覆盖率条目列表应只负责 chips 渲染和空列表隐藏',
  },
];
