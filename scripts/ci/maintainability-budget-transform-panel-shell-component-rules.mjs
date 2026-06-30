export const transformPanelShellComponentMaintainabilityBudgets = [
  {
    file: 'frontend/src/components/TransformReportPanel.tsx',
    maxLines: 700,
    reason: '深度解析报告主面板应只负责状态、复制动作和 footer 编排，内容区渲染、顶部总览、空态、Top 分布、展开记录、未展开线索、运行时占位符和跳过记录展示不得回流',
  },
  {
    file: 'frontend/src/components/TransformReportPanelContent.tsx',
    maxLines: 240,
    reason: '深度解析报告内容区只负责按 section 可见性装配总览、筛选、记录、未展开、占位符、告警和空态，复制动作与状态编排留在主面板',
  },
  {
    file: 'frontend/src/components/TransformReportTopDistributions.tsx',
    maxLines: 180,
    reason: '深度解析报告 Top 分布按钮应保持纯展示组件，筛选状态留在主面板',
  },
];
