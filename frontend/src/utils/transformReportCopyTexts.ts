import { APP_VERSION_LABEL } from './appVersion';
import type {
  TransformContextReport,
  TransformReportView,
} from './transformSummaryTypes';
import {
  getTransformDecodedPathCopyText,
  getTransformPathValueCopyRows,
} from './transformReportCopyPayloads';
import { appendReportPlaceholderSection } from './transformReportTextSections';
export { formatTransformCmdStructureReportText } from './transformReportCopyCmdStructureText';

export const formatTransformPathValueReportText = (
  reportView: TransformReportView
): string => {
  const lines: string[] = [];

  reportView.records.forEach(record => {
    const isFocusedNestedCommandCopy = record.cmdStructureFocusLabel === '内部 CMD 字段' &&
      Boolean(record.nestedCommandSearchFields?.length);
    const copiedRows = getTransformPathValueCopyRows(record);
    copiedRows.forEach(row => {
      lines.push(getTransformDecodedPathCopyText(row));
    });

    if (
      !isFocusedNestedCommandCopy &&
      (record.indexedDecodedPathCount > copiedRows.length || record.decodedPathCount > copiedRows.length)
    ) {
      lines.push(`... ${record.path} 还有更多内部路径未复制`);
    }
  });

  if (reportView.isRecordTruncated) {
    lines.push(`... 还有 ${reportView.filteredRecordCount - reportView.records.length} 条展开记录未复制`);
  }

  return lines.join('\n');
};

export const formatTransformPlaceholderReportText = (
  report: TransformContextReport,
  reportView: TransformReportView,
  query: string
): string => {
  const normalizedQuery = query.trim();
  const lines = [
    report.summaryText || '深度解析: 无展开记录',
    `工具版本: ${APP_VERSION_LABEL}`,
    ...(normalizedQuery ? [`筛选: ${normalizedQuery}`] : []),
    `占位符: ${reportView.filteredPlaceholderCount}/${reportView.totalPlaceholderCount}`,
  ];

  if (reportView.filteredPlaceholderCount === 0) {
    lines.push('', '运行时占位符:', '- 无匹配占位符');
    return lines.join('\n');
  }

  appendReportPlaceholderSection(lines, reportView.runtimePlaceholderGroups, reportView.runtimePlaceholders);
  if (reportView.isPlaceholderTruncated) {
    lines.push(`- 还有 ${reportView.filteredPlaceholderCount - reportView.runtimePlaceholders.length} 个运行时占位符未复制`);
  }

  return lines.join('\n');
};
