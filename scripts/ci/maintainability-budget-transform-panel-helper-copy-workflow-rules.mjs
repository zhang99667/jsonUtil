export const transformPanelHelperCopyWorkflowMaintainabilityBudgets = [
  {
    file: 'frontend/src/utils/transformReportPanelCopyWorkflow.ts',
    maxLines: 45,
    reason: '深度解析面板复制 workflow 入口应只组合报告级、占位符样本和行级 CMD 复制子模块',
  },
  {
    file: 'frontend/src/utils/transformReportPanelCopyWorkflowTypes.ts',
    maxLines: 130,
    reason: '深度解析面板复制 workflow 契约应集中描述状态、effects 和分组 handler 类型',
  },
  {
    file: 'frontend/src/utils/transformReportPanelReportCopyWorkflow.ts',
    maxLines: 190,
    reason: '深度解析报告级复制 workflow 应只封装 reportView 依赖的导出、质量基线和归档协作报告动作',
  },
  {
    file: 'frontend/src/utils/transformReportPanelTemplateCopyWorkflow.ts',
    maxLines: 120,
    reason: '深度解析占位符和问题样本复制 workflow 应保持独立，避免回流主面板',
  },
  {
    file: 'frontend/src/utils/transformReportPanelInlineCopyWorkflow.ts',
    maxLines: 110,
    reason: '深度解析行级路径、原始值和 CMD 对比复制 workflow 应保持独立小模块',
  },
  {
    file: 'frontend/src/utils/transformReportPanelCopyWorkflow.test.ts',
    maxLines: 260,
    reason: '深度解析复制 workflow 单测应覆盖 pending、CMD 对比注入、质量基线、占位符和行级复制边界',
  },
];
