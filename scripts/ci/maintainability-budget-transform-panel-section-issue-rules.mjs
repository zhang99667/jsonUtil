export const transformPanelIssueSectionMaintainabilityBudgets = [
  {
    file: 'frontend/src/components/TransformReportUnresolvedSection.tsx',
    maxLines: 140,
    reason: '深度解析报告未展开线索区域应保持纯展示组件，复制、定位和 Scheme 打开动作由主面板注入',
  },
  {
    file: 'frontend/src/components/TransformReportWarningsSection.tsx',
    maxLines: 120,
    reason: '深度解析报告跳过记录区域应保持纯展示组件，复制、定位和 Scheme 打开动作由主面板注入',
  },
];
