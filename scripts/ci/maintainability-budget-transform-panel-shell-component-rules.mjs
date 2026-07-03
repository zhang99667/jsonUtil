const shellComponentBudget = (file, maxLines, reason) => ({
  file: `frontend/src/components/${file}`,
  maxLines,
  reason,
});

export const transformPanelShellComponentMaintainabilityBudgets = [
  shellComponentBudget('TransformReportPanel.tsx', 305, '深度解析报告主面板应只负责状态、报告派生、workflow model 和内容 wiring，记录区 action 绑定、复制/导出 workflow、footer model、面板 shell、内容区渲染、顶部总览、空态、Top 分布、展开记录、未展开线索、运行时占位符和跳过记录展示不得回流'),
  shellComponentBudget('TransformReportPanelFrame.tsx', 60, '深度解析报告 frame 应只维护 DraggablePanel 默认布局、标题和 footer 装配，状态与内容 wiring 留在主面板'),
  shellComponentBudget('TransformReportPanelContent.tsx', 45, '深度解析报告内容区壳组件只负责滚动容器、无报告提示和 sections 装配分流，section 细节不得回流'),
  shellComponentBudget('TransformReportPanelSections.tsx', 145, '深度解析报告 sections 组件只负责总览、筛选、记录、未展开、占位符、告警和空态装配，记录动作通过契约对象注入'),
  shellComponentBudget('TransformReportPanelSectionsTypes.ts', 55, '深度解析报告 sections props 契约应独立维护，记录区动作与 CMD 对比状态不得再摊平成多项 props'),
  shellComponentBudget('TransformReportTopDistributions.tsx', 180, '深度解析报告 Top 分布按钮应保持纯展示组件，筛选状态留在主面板'),
];
