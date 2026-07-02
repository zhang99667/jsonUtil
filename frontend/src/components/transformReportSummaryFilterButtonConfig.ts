import type { TransformContextReport } from '../utils/transformSummary';
import type { TransformReportSummaryMetricButtonTone } from './transformReportSummaryMetricButtons';

type TransformReportSummaryFilterCountSource =
  | 'cmdStructure'
  | 'nestedCommand'
  | 'nestedResource'
  | 'issuePriority'
  | 'nonReversible'
  | 'unresolved'
  | 'warning'
  | 'placeholder';

export interface TransformReportSummaryFilterButtonConfig {
  label: string;
  query: string;
  dataTour: string;
  title: string;
  tone: TransformReportSummaryMetricButtonTone;
  countSource: TransformReportSummaryFilterCountSource;
}

export const transformReportSummaryFilterButtonConfigs: TransformReportSummaryFilterButtonConfig[] = [
  {
    label: 'CMD结构',
    query: 'CMD结构',
    dataTour: 'transform-report-cmd-structure-count',
    title: '筛选可复制的 cmdHandler CMD 结构',
    tone: 'cyan',
    countSource: 'cmdStructure',
  },
  {
    label: '内部CMD',
    query: '内部CMD字段',
    dataTour: 'transform-report-nested-cmd-count',
    title: '筛选包含内部 CMD/Scheme 字段的展开记录',
    tone: 'cyan',
    countSource: 'nestedCommand',
  },
  {
    label: '资源URL',
    query: '资源URL',
    dataTour: 'transform-report-nested-resource-count',
    title: '筛选包含静态素材资源 URL 的展开记录',
    tone: 'slate',
    countSource: 'nestedResource',
  },
  {
    label: '待处理',
    query: '待处理',
    dataTour: 'transform-report-issue-priority',
    title: '筛选待检查、跳过记录和运行时占位符',
    tone: 'rose',
    countSource: 'issuePriority',
  },
  {
    label: '不可逆',
    query: '不可逆',
    dataTour: 'transform-report-non-reversible-count',
    title: '筛选不可逆解析记录',
    tone: 'amber',
    countSource: 'nonReversible',
  },
  {
    label: '待检查',
    query: '待检查',
    dataTour: 'transform-report-unresolved-count',
    title: '筛选未展开线索',
    tone: 'sky',
    countSource: 'unresolved',
  },
  {
    label: '跳过',
    query: '跳过',
    dataTour: 'transform-report-warning-count',
    title: '筛选性能保护跳过记录',
    tone: 'amber',
    countSource: 'warning',
  },
  {
    label: '占位符',
    query: '占位符',
    dataTour: 'transform-report-placeholder-count',
    title: '筛选运行时占位符',
    tone: 'violet',
    countSource: 'placeholder',
  },
];

export const getTransformReportSummaryFilterButtonCount = (
  report: TransformContextReport,
  issuePriorityCount: number,
  countSource: TransformReportSummaryFilterCountSource
): number => {
  if (countSource === 'cmdStructure') return report.cmdStructureCount;
  if (countSource === 'nestedCommand') return report.nestedCommandFieldCount;
  if (countSource === 'nestedResource') return report.nestedResourceFieldCount || 0;
  if (countSource === 'issuePriority') return issuePriorityCount;
  if (countSource === 'nonReversible') return report.summary.schemeCounts.nonReversible;
  if (countSource === 'unresolved') return report.summary.unresolvedCount;
  if (countSource === 'warning') return report.summary.warningCount;
  return report.summary.placeholderCount;
};
