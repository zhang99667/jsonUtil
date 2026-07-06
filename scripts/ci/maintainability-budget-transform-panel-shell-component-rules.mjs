const shellComponentBudget = (file, maxLines, reason) => ({
  file: `frontend/src/components/${file}`,
  maxLines,
  reason,
});

export const transformPanelShellComponentMaintainabilityBudgets = [
  shellComponentBudget('TransformReportPanel.tsx', 210, '深度解析报告主面板应只负责 workflow model、动作绑定、footer model 和内容 wiring，报告视图状态不得回流'),
  shellComponentBudget('useTransformReportPanelViewModel.ts', 90, '深度解析报告 ViewModel hook 应只维护面板打开状态、筛选延迟、报告视图和派生模型组合'),
  shellComponentBudget('useTransformReportPanelResetEffect.ts', 35, '深度解析报告重置 effect 只负责上下文切换时清理筛选、CMD 对比和质量基线状态'),
  shellComponentBudget('TransformReportPanelViewModelTypes.ts', 40, '深度解析报告 ViewModel 类型契约应独立维护，避免 hook 被 props 和返回模型声明撑大'),
  shellComponentBudget('TransformReportPanelFrame.tsx', 60, '深度解析报告 frame 应只维护 DraggablePanel 默认布局、标题和 footer 装配，状态与内容 wiring 留在主面板'),
  shellComponentBudget('TransformReportPanelContent.tsx', 45, '深度解析报告内容区壳组件只负责滚动容器、无报告提示和 sections 装配分流，section 细节不得回流'),
  shellComponentBudget('TransformReportPanelSections.tsx', 145, '深度解析报告 sections 组件只负责总览、筛选、记录、未展开、占位符、告警和空态装配，记录动作通过契约对象注入'),
  shellComponentBudget('TransformReportPanelSectionsTypes.ts', 55, '深度解析报告 sections props 契约应独立维护，记录区动作与 CMD 对比状态不得再摊平成多项 props'),
  shellComponentBudget('TransformReportTopDistributions.tsx', 180, '深度解析报告 Top 分布按钮应保持纯展示组件，筛选状态留在主面板'),
];
