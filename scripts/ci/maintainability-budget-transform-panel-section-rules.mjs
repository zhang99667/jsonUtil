import { transformPanelPlaceholderSectionMaintainabilityBudgets } from './maintainability-budget-transform-panel-placeholder-section-rules.mjs';
import { transformPanelSectionSmallMaintainabilityBudgets } from './maintainability-budget-transform-panel-section-small-rules.mjs';

export const transformPanelSectionMaintainabilityBudgets = [
  ...transformPanelSectionSmallMaintainabilityBudgets,
  ...transformPanelPlaceholderSectionMaintainabilityBudgets,
  {
    file: 'frontend/src/components/TransformReportSummarySection.tsx',
    maxLines: 110,
    reason: '深度解析报告顶部总览应保持模块装配组件，指标栏、行动面板和优先处理展示应继续下沉',
  },
  {
    file: 'frontend/src/components/TransformReportSummaryMetricsBar.tsx',
    maxLines: 200,
    reason: '深度解析顶部指标栏应集中治理筛选 chip、计数按钮和快捷入口禁用态',
  },
  {
    file: 'frontend/src/components/TransformReportNextActionsPanel.tsx',
    maxLines: 60,
    reason: '深度解析下一步行动面板应只负责行动卡片展示和动作转发',
  },
  {
    file: 'frontend/src/components/TransformReportIssueTriagePanel.tsx',
    maxLines: 80,
    reason: '深度解析优先处理面板应只负责待处理卡片展示、全量筛选和单项动作转发',
  },
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
