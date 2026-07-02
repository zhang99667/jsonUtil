const transformFilterBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const transformFilterMaintainabilityBudgets = [
  transformFilterBudget('frontend/src/utils/transformReportFilters.ts', 80, '深度解析报告筛选入口只保留记录匹配与兼容导出，视图裁剪和谓词应分层'),
  transformFilterBudget('frontend/src/utils/transformReportFilterMatchers.ts', 80, '深度解析报告筛选匹配谓词应保持纯函数，避免回流到筛选视图裁剪模块'),
  transformFilterBudget('frontend/src/utils/transformReportFilterViewMatches.ts', 60, '深度解析报告筛选命中收集应独立维护四类行匹配，避免视图 patch helper 承载谓词'),
  transformFilterBudget('frontend/src/utils/transformReportFilterViewPatches.ts', 50, '深度解析报告筛选视图 patch 入口只维护 decoded path 裁剪和字段 patch 组合'),
  transformFilterBudget('frontend/src/utils/transformReportFilterViewNestedPatches.ts', 65, '深度解析报告筛选 nested command/resource 字段 patch 应独立维护裁剪和清空规则'),
  transformFilterBudget('frontend/src/utils/transformReportFilterViewFocusPatch.ts', 55, '深度解析报告筛选 CMD 结构聚焦 patch 应独立维护聚焦优先级和路径计数'),
  transformFilterBudget('frontend/src/utils/transformReportFilterView.ts', 45, '深度解析报告筛选视图入口只保留空 query、无命中短路和 patch 合并'),
];
