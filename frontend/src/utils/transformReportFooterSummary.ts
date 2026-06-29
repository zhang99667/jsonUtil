import type { TransformReportView } from './transformSummary';

type TransformReportFooterSummaryView = Pick<
  TransformReportView,
  | 'filteredRecordCount'
  | 'totalRecordCount'
  | 'filteredCmdStructureCount'
  | 'totalCmdStructureCount'
  | 'filteredNestedCommandFieldCount'
  | 'totalNestedCommandFieldCount'
  | 'filteredNestedResourceFieldCount'
  | 'totalNestedResourceFieldCount'
  | 'filteredPlaceholderCount'
  | 'totalPlaceholderCount'
  | 'filteredUnresolvedCount'
  | 'totalUnresolvedCount'
  | 'filteredWarningCount'
  | 'totalWarningCount'
>;

export const formatTransformReportFooterSummary = (
  reportView?: TransformReportFooterSummaryView | null
): string => {
  if (!reportView) return '暂无解析上下文';

  return [
    `${reportView.filteredRecordCount}/${reportView.totalRecordCount} 条展开记录`,
    `${reportView.filteredCmdStructureCount}/${reportView.totalCmdStructureCount} 条CMD结构`,
    `${reportView.filteredNestedCommandFieldCount}/${reportView.totalNestedCommandFieldCount} 个内部CMD字段`,
    `${reportView.filteredNestedResourceFieldCount}/${reportView.totalNestedResourceFieldCount} 个资源字段`,
    `${reportView.filteredPlaceholderCount}/${reportView.totalPlaceholderCount} 个占位符`,
    `${reportView.filteredUnresolvedCount}/${reportView.totalUnresolvedCount} 条待检查`,
    `${reportView.filteredWarningCount}/${reportView.totalWarningCount} 条跳过记录`,
  ].join(' · ');
};
