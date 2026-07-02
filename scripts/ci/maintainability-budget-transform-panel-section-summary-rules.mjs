const summarySectionBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const transformPanelSummarySectionMaintainabilityBudgets = [
  summarySectionBudget('frontend/src/components/TransformReportSummarySection.tsx', 110, '深度解析报告顶部总览应保持模块装配组件，指标栏、行动面板和优先处理展示应继续下沉'),
  summarySectionBudget('frontend/src/components/TransformReportSummaryMetricsBar.tsx', 125, '深度解析顶部指标栏应只负责指标顺序和条件装配，按钮样式交给 helper'),
  summarySectionBudget('frontend/src/components/transformReportSummaryMetricButtons.tsx', 80, '深度解析顶部指标按钮 helper 应只维护 tone 样式、按钮渲染和禁用态透传'),
  summarySectionBudget('frontend/src/components/transformReportSummaryFilterButtonItems.ts', 35, '深度解析顶部筛选按钮入口只负责静态配置、计数 resolver 和零计数过滤的组合'),
  summarySectionBudget('frontend/src/components/transformReportSummaryFilterButtonConfig.ts', 130, '深度解析顶部筛选按钮静态配置应集中维护 label、query、tour、title、tone 和计数来源'),
  summarySectionBudget('frontend/src/components/transformReportSummaryFilterButtonItems.test.ts', 85, '深度解析顶部筛选按钮测试应锁定固定顺序、计数映射和零计数过滤'),
  summarySectionBudget('frontend/src/components/TransformReportNextActionsPanel.tsx', 60, '深度解析下一步行动面板应只负责行动卡片展示和动作转发'),
  summarySectionBudget('frontend/src/components/TransformReportIssueTriagePanel.tsx', 80, '深度解析优先处理面板应只负责待处理卡片展示、全量筛选和单项动作转发'),
];
