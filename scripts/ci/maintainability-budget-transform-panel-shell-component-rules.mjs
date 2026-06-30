const shellComponentBudget = (file, maxLines, reason) => ({
  file: `frontend/src/components/${file}`,
  maxLines,
  reason,
});

export const transformPanelShellComponentMaintainabilityBudgets = [
  shellComponentBudget('TransformReportPanel.tsx', 430, '深度解析报告主面板应只负责状态、footer/action 装配和 shell wiring，复制/导出 workflow、内容区渲染、顶部总览、空态、Top 分布、展开记录、未展开线索、运行时占位符和跳过记录展示不得回流'),
  shellComponentBudget('TransformReportPanelContent.tsx', 45, '深度解析报告内容区壳组件只负责滚动容器、无报告提示和 sections 装配分流，section 细节不得回流'),
  shellComponentBudget('TransformReportPanelSections.tsx', 180, '深度解析报告 sections 组件只负责总览、筛选、记录、未展开、占位符、告警和空态装配，状态编排留在主面板'),
  shellComponentBudget('TransformReportPanelSectionsTypes.ts', 70, '深度解析报告 sections props 契约应独立维护，避免渲染装配文件因类型声明回涨'),
  shellComponentBudget('TransformReportTopDistributions.tsx', 180, '深度解析报告 Top 分布按钮应保持纯展示组件，筛选状态留在主面板'),
];
