export const transformFilterMaintainabilityBudgets = [
  {
    file: 'frontend/src/utils/transformReportFilters.ts',
    maxLines: 80,
    reason: '深度解析报告筛选入口只保留记录匹配与兼容导出，视图裁剪和谓词应分层',
  },
  {
    file: 'frontend/src/utils/transformReportFilterMatchers.ts',
    maxLines: 80,
    reason: '深度解析报告筛选匹配谓词应保持纯函数，避免回流到筛选视图裁剪模块',
  },
  {
    file: 'frontend/src/utils/transformReportFilterView.ts',
    maxLines: 120,
    reason: '深度解析报告筛选视图裁剪应保持纯函数，避免回流到筛选入口或聚合文件',
  },
];
