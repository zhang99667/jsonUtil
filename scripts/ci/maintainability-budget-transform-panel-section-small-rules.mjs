export const transformPanelSectionSmallMaintainabilityBudgets = [
  {
    file: 'frontend/src/components/TransformReportEmptyState.tsx',
    maxLines: 35,
    reason: '深度解析报告空态应保持纯展示组件，筛选清空动作由主面板注入',
  },
  {
    file: 'frontend/src/components/TransformReportCoverageCard.tsx',
    maxLines: 35,
    reason: '深度解析报告覆盖率卡片应保持纯展示组件，覆盖率判定和筛选动作由上游注入',
  },
];
