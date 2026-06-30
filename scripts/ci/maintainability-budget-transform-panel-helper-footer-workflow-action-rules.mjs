export const transformPanelHelperFooterWorkflowActionMaintainabilityBudgets = [
  {
    file: 'frontend/src/utils/transformReportFooterActions.ts',
    maxLines: 60,
    reason: '深度解析报告 footer 操作入口应只保留操作顺序编排，action 生成放在 builder 模块',
  },
  {
    file: 'frontend/src/utils/transformReportFooterActionBuilders.ts',
    maxLines: 70,
    reason: '深度解析报告 footer 配置化、筛选和 CMD action 生成规则应保持纯函数模块',
  },
  {
    file: 'frontend/src/utils/transformReportFooterActionFactory.ts',
    maxLines: 40,
    reason: '深度解析报告 footer action ariaLabel 兜底规则应保持独立小函数',
  },
  {
    file: 'frontend/src/utils/transformReportFooterBaselineActions.ts',
    maxLines: 70,
    reason: '深度解析报告质量基线 footer action 应独立承接基线筛选文案和禁用态',
  },
];
