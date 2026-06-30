import { APP_VERSION_LABEL } from './appVersion';
import { formatSourceLabelText } from './sourceLabels';
import type {
  TransformContextReport,
  TransformReportView,
} from './transformSummaryTypes';
import { getTransformRecordCmdStructureCopyText } from './transformReportCopyPayloads';

export const formatTransformCmdStructureReportText = (
  report: TransformContextReport,
  reportView: TransformReportView,
  query: string
): string => {
  const records = reportView.cmdStructureRecords;
  if (records.length === 0) return '';

  const normalizedQuery = query.trim();
  const lines = [
    report.summaryText || '深度解析: 无展开记录',
    `工具版本: ${APP_VERSION_LABEL}`,
    ...(normalizedQuery ? [`筛选: ${normalizedQuery}`] : []),
    reportView.isCmdStructureTruncated
      ? `CMD 结构: ${records.length}/${reportView.filteredCmdStructureCount} 条`
      : `CMD 结构: ${records.length} 条`,
  ];

  records.forEach(record => {
    lines.push('', `路径: ${record.path}`);
    if (record.sourceLabel) {
      lines.push(formatSourceLabelText(record.sourceLabel));
    }
    if (record.insights.length > 0) {
      lines.push(`解析线索: ${record.insights.join('；')}`);
    }
    if (record.commandParamCount !== undefined) {
      const visibleKeys = record.commandParamKeys || [];
      const hiddenKeyCount = Math.max(record.commandParamCount - visibleKeys.length, 0);
      lines.push(
        `cmdParams: ${record.commandParamCount} 个顶层参数${
          visibleKeys.length > 0
            ? `（${visibleKeys.join(', ')}${hiddenKeyCount > 0 ? ` ... +${hiddenKeyCount}` : ''}）`
            : ''
        }`
      );
    }
    if (record.cmdStructureFocusPaths?.length) {
      lines.push(
        `聚焦复制: 已按筛选命中的 ${record.cmdStructureFocusCount || record.cmdStructureFocusPaths.length} 个${record.cmdStructureFocusLabel || '内部路径'}裁剪 cmdParams`
      );
    }
    if (record.nestedCommandFieldCount > 0) {
      lines.push(`内部CMD字段: ${record.nestedCommandFieldCount}`);
      record.nestedCommandFields.forEach(row => {
        lines.push(`内部CMD字段路径: ${row.path} = ${row.preview}`);
      });
      if (record.hasMoreNestedCommandFields) {
        lines.push(`内部CMD字段路径: 还有更多未展示（已索引 ${record.indexedNestedCommandFieldCount} 个）`);
      }
    }
    lines.push(getTransformRecordCmdStructureCopyText(record));
  });

  if (reportView.isCmdStructureTruncated) {
    lines.push(`... 还有 ${reportView.filteredCmdStructureCount - records.length} 条 CMD 结构未复制`);
  }

  return lines.join('\n');
};
