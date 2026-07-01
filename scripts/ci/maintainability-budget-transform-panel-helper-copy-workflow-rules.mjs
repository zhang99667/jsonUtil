const copyWorkflowBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const transformPanelHelperCopyWorkflowMaintainabilityBudgets = [
  copyWorkflowBudget('frontend/src/utils/transformReportPanelCopyWorkflow.ts', 45, '深度解析面板复制 workflow 入口应只组合报告级、占位符样本和行级 CMD 复制子模块'),
  copyWorkflowBudget('frontend/src/utils/transformReportPanelCopyWorkflowTypes.ts', 130, '深度解析面板复制 workflow 契约应集中描述状态、effects 和分组 handler 类型'),
  copyWorkflowBudget('frontend/src/utils/transformReportPanelReportCopyWorkflow.ts', 175, '深度解析报告级复制 workflow 应只封装报告级动作编排，通用复制 runner 和 CMD 对比上下文下沉到 helper'),
  copyWorkflowBudget('frontend/src/utils/transformReportPanelReportCopyActions.ts', 105, '深度解析报告级复制 action helper 只维护 reportView guard、成功文案包装、路径/CMD 特殊文案和 CMD 对比上下文'),
  copyWorkflowBudget('frontend/src/utils/transformReportPanelTemplateCopyWorkflow.ts', 120, '深度解析占位符和问题样本复制 workflow 应保持独立，避免回流主面板'),
  copyWorkflowBudget('frontend/src/utils/transformReportPanelInlineCopyWorkflow.ts', 110, '深度解析行级路径、原始值和 CMD 对比复制 workflow 应保持独立小模块'),
  copyWorkflowBudget('frontend/src/utils/transformReportPanelCopyWorkflow.test.ts', 170, '深度解析复制 workflow 单测应只保留 pending、CMD 对比注入、质量基线、占位符和行级复制行为断言'),
  copyWorkflowBudget('frontend/src/utils/transformReportPanelCopyWorkflowTestFixture.ts', 150, '深度解析复制 workflow 测试 fixture 应集中 mock、默认 state/effects 和 guarded action 列表'),
];
