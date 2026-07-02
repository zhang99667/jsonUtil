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
    file: 'frontend/src/utils/transformReportFilterViewMatches.ts',
    maxLines: 60,
    reason: '深度解析报告筛选命中收集应独立维护四类行匹配，避免视图 patch helper 承载谓词',
  },
  {
    file: 'frontend/src/utils/transformReportFilterViewPatches.ts',
    maxLines: 95,
    reason: '深度解析报告筛选视图 patch 应独立维护裁剪、清空和字段 patch 组合',
  },
  {
    file: 'frontend/src/utils/transformReportFilterViewFocusPatch.ts',
    maxLines: 55,
    reason: '深度解析报告筛选 CMD 结构聚焦 patch 应独立维护聚焦优先级和路径计数',
  },
  {
    file: 'frontend/src/utils/transformReportFilterView.ts',
    maxLines: 45,
    reason: '深度解析报告筛选视图入口只保留空 query、无命中短路和 patch 合并',
  },
];
