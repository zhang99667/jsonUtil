const panelUiBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const transformPanelHelperUiMaintainabilityBudgets = [
  panelUiBudget('frontend/src/utils/transformReportCopyTitles.ts', 100, '深度解析报告复制入口 title 矩阵应保持纯函数和集中测试'),
  panelUiBudget('frontend/src/utils/transformReportPanelHelpers.ts', 40, '深度解析报告 UI helper 入口应只保留兼容导出，复制指标和占位符摘要留在专用 helper'),
  panelUiBudget('frontend/src/utils/transformReportPanelSectionModel.ts', 110, '深度解析报告 section view-model 应只组合可见性、占位符工具栏和行动项纯派生，状态与 handler wiring 留在主面板'),
  panelUiBudget('frontend/src/utils/transformReportFooterSummary.ts', 60, '深度解析报告 footer 汇总文案应保持纯函数和集中测试'),
  panelUiBudget('frontend/src/utils/transformReportPlaceholderToolbarState.ts', 45, '深度解析占位符工具栏状态应保持纯派生，不承载 handler 或 JSX'),
  panelUiBudget('frontend/src/utils/transformReportSectionVisibility.ts', 35, '深度解析报告 section 可见性入口应只编排可见区域 flag 和空态，具体计数派生留在专用 helper'),
  panelUiBudget('frontend/src/utils/transformReportVisibleSections.ts', 40, '深度解析报告可见区域 flag helper 应只维护四类筛选计数到 section 显隐的纯派生'),
  panelUiBudget('frontend/src/utils/transformReportSectionVisibilityTypes.ts', 25, '深度解析报告 section 可见性类型契约应独立维护输入、区域 flag 和空态输出结构'),
  panelUiBudget('frontend/src/utils/transformReportPanelStyles.ts', 60, '深度解析报告样式映射应保持纯函数和少量 tone 分支'),
];
