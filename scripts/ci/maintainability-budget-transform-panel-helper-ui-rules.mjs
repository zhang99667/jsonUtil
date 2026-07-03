const panelUiBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const transformPanelHelperUiMaintainabilityBudgets = [
  panelUiBudget('frontend/src/utils/transformReportCopyTitles.ts', 100, '深度解析报告复制入口 title 矩阵应保持纯函数和集中测试'),
  panelUiBudget('frontend/src/utils/transformReportPanelHelpers.ts', 40, '深度解析报告 UI helper 入口应只保留兼容导出，复制指标和占位符摘要留在专用 helper'),
  panelUiBudget('frontend/src/utils/transformReportPanelSectionModel.ts', 75, '深度解析报告 section view-model 应只组合可见性、占位符模型和行动模型，状态与 handler wiring 留在主面板'),
  panelUiBudget('frontend/src/utils/transformReportPanelPlaceholderModel.ts', 55, '深度解析报告占位符面板模型应只维护回填入口和工具栏状态派生'),
  panelUiBudget('frontend/src/utils/transformReportPanelActionModel.ts', 75, '深度解析报告行动模型应只维护问题优先级、triage 和下一步动作派生'),
  panelUiBudget('frontend/src/utils/transformReportPanelActionModelTypes.ts', 35, '深度解析报告行动模型输入输出契约应独立维护，避免聚合入口重新堆回类型定义'),
  panelUiBudget('frontend/src/utils/transformReportPanelActionState.ts', 60, '深度解析报告行动状态派生应保持纯函数，item builder 入口只做装配'),
  panelUiBudget('frontend/src/utils/transformReportPanelSectionModelTypes.ts', 35, '深度解析报告 section 模型契约应独立维护，避免组合入口重新堆回 props 类型'),
  panelUiBudget('frontend/src/utils/transformReportFooterSummary.ts', 60, '深度解析报告 footer 汇总文案应保持纯函数和集中测试'),
  panelUiBudget('frontend/src/utils/transformReportPlaceholderToolbarState.ts', 35, '深度解析占位符工具栏状态入口应只保留纯派生和兼容类型导出'),
  panelUiBudget('frontend/src/utils/transformReportPlaceholderToolbarStateTypes.ts', 30, '深度解析占位符工具栏状态类型契约应独立维护输入和输出结构'),
  panelUiBudget('frontend/src/utils/transformReportSectionVisibility.ts', 35, '深度解析报告 section 可见性入口应只编排可见区域 flag 和空态，具体计数派生留在专用 helper'),
  panelUiBudget('frontend/src/utils/transformReportVisibleSections.ts', 40, '深度解析报告可见区域 flag helper 应只维护四类筛选计数到 section 显隐的纯派生'),
  panelUiBudget('frontend/src/utils/transformReportSectionVisibilityTypes.ts', 25, '深度解析报告 section 可见性类型契约应独立维护输入、区域 flag 和空态输出结构'),
  panelUiBudget('frontend/src/utils/transformReportPanelStyles.ts', 60, '深度解析报告样式映射应保持纯函数和少量 tone 分支'),
];
