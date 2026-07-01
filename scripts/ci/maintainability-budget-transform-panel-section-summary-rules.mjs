const summarySectionBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const transformPanelSummarySectionMaintainabilityBudgets = [
  summarySectionBudget('frontend/src/components/TransformReportSummarySection.tsx', 110, '深度解析报告顶部总览应保持模块装配组件，指标栏、行动面板和优先处理展示应继续下沉'),
  summarySectionBudget('frontend/src/components/TransformReportSummaryMetricsBar.tsx', 125, '深度解析顶部指标栏应只负责指标顺序和条件装配，按钮样式交给 helper'),
  summarySectionBudget('frontend/src/components/transformReportSummaryMetricButtons.tsx', 80, '深度解析顶部指标按钮 helper 应只维护 tone 样式、按钮渲染和禁用态透传'),
  summarySectionBudget('frontend/src/components/transformReportSummaryFilterButtonItems.ts', 85, '深度解析顶部筛选按钮配置应独立维护，避免指标栏回流重复按钮配置'),
  summarySectionBudget('frontend/src/components/TransformReportNextActionsPanel.tsx', 60, '深度解析下一步行动面板应只负责行动卡片展示和动作转发'),
  summarySectionBudget('frontend/src/components/TransformReportIssueTriagePanel.tsx', 80, '深度解析优先处理面板应只负责待处理卡片展示、全量筛选和单项动作转发'),
];
