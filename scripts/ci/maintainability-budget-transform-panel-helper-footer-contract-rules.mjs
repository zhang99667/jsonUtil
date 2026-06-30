export const transformPanelHelperFooterContractMaintainabilityBudgets = [
  {
    file: 'frontend/src/utils/transformReportFooterActionTypes.ts',
    maxLines: 70,
    reason: '深度解析报告 footer 操作类型应保持稳定、集中导出',
  },
  {
    file: 'frontend/src/utils/transformReportFooterActionConfig.ts',
    maxLines: 80,
    reason: '深度解析报告 footer 操作配置表过多时应继续按操作域拆分',
  },
];
