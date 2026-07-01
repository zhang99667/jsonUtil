import type { TransformContextReport } from '../utils/transformSummary';
import type { TransformReportSummaryFilterButtonItem } from './transformReportSummaryMetricButtons';

export const getTransformReportSummaryFilterButtonItems = (
  report: TransformContextReport,
  issuePriorityCount: number
): TransformReportSummaryFilterButtonItem[] => {
  const items: TransformReportSummaryFilterButtonItem[] = [{
    label: 'CMD结构',
    count: report.cmdStructureCount,
    query: 'CMD结构',
    dataTour: 'transform-report-cmd-structure-count',
    title: '筛选可复制的 cmdHandler CMD 结构',
    tone: 'cyan',
  },
  {
    label: '内部CMD',
    count: report.nestedCommandFieldCount,
    query: '内部CMD字段',
    dataTour: 'transform-report-nested-cmd-count',
    title: '筛选包含内部 CMD/Scheme 字段的展开记录',
    tone: 'cyan',
  },
  {
    label: '资源URL',
    count: report.nestedResourceFieldCount || 0,
    query: '资源URL',
    dataTour: 'transform-report-nested-resource-count',
    title: '筛选包含静态素材资源 URL 的展开记录',
    tone: 'slate',
  },
  {
    label: '待处理',
    count: issuePriorityCount,
    query: '待处理',
    dataTour: 'transform-report-issue-priority',
    title: '筛选待检查、跳过记录和运行时占位符',
    tone: 'rose',
  },
  {
    label: '不可逆',
    count: report.summary.schemeCounts.nonReversible,
    query: '不可逆',
    dataTour: 'transform-report-non-reversible-count',
    title: '筛选不可逆解析记录',
    tone: 'amber',
  },
  {
    label: '待检查',
    count: report.summary.unresolvedCount,
    query: '待检查',
    dataTour: 'transform-report-unresolved-count',
    title: '筛选未展开线索',
    tone: 'sky',
  },
  {
    label: '跳过',
    count: report.summary.warningCount,
    query: '跳过',
    dataTour: 'transform-report-warning-count',
    title: '筛选性能保护跳过记录',
    tone: 'amber',
  },
  {
    label: '占位符',
    count: report.summary.placeholderCount,
    query: '占位符',
    dataTour: 'transform-report-placeholder-count',
    title: '筛选运行时占位符',
    tone: 'violet',
  }];

  return items.filter(item => item.count > 0);
};
