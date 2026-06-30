import { APP_VERSION_LABEL } from './appVersion';
import type {
  TransformContextReport,
  TransformReportRecord,
  TransformReportView,
} from './transformSummaryTypes';
import {
  appendReportPlaceholderSection,
  appendReportRecordLines,
  appendReportUnresolvedSection,
  appendReportWarningSection,
} from './transformReportTextSections';
export { formatTransformDiagnosticSummaryText } from './transformReportDiagnosticSummaryText';

const DIAGNOSTIC_COMMAND_SCHEMA_ROW_LIMIT = 8;

const formatDecodedPathCount = (record: Pick<
  TransformReportRecord,
  'decodedPathCount' | 'isDecodedPathCountTruncated'
>): string => (
  record.isDecodedPathCountTruncated ? `${record.decodedPathCount}+` : String(record.decodedPathCount)
);

export const formatTransformReportViewText = (
  report: TransformContextReport,
  reportView: TransformReportView,
  query: string
): string => {
  const normalizedQuery = query.trim();
  const lines = [
    report.summaryText || '深度解析: 无展开记录',
    `工具版本: ${APP_VERSION_LABEL}`,
    `筛选: ${normalizedQuery || '全部'}`,
    `筛选结果: 展开 ${reportView.filteredRecordCount}/${reportView.totalRecordCount}，内部CMD字段 ${reportView.filteredNestedCommandFieldCount}/${reportView.totalNestedCommandFieldCount}，资源字段 ${reportView.filteredNestedResourceFieldCount}/${reportView.totalNestedResourceFieldCount}，占位符 ${reportView.filteredPlaceholderCount}/${reportView.totalPlaceholderCount}，参数层 ${reportView.filteredSchemeParamStageCount}/${reportView.totalSchemeParamStageCount}，参数修复 ${reportView.filteredSchemeParamStageRepairHintCount}/${reportView.totalSchemeParamStageRepairHintCount}，待检查 ${reportView.filteredUnresolvedCount}/${reportView.totalUnresolvedCount}，跳过 ${reportView.filteredWarningCount}/${reportView.totalWarningCount}`,
  ];

  if (
    reportView.filteredRecordCount === 0 &&
    reportView.filteredPlaceholderCount === 0 &&
    reportView.filteredUnresolvedCount === 0 &&
    reportView.filteredWarningCount === 0
  ) {
    lines.push('', '筛选结果:', '- 无匹配记录');
    return lines.join('\n');
  }

  if (reportView.filteredRecordCount > 0) {
    lines.push('', '展开记录:');
    appendReportRecordLines(lines, reportView.records, {
      commandSchemaRowLimit: DIAGNOSTIC_COMMAND_SCHEMA_ROW_LIMIT,
      formatDecodedPathCount,
    });
    if (reportView.isRecordTruncated) {
      lines.push(`- 还有 ${reportView.filteredRecordCount - reportView.records.length} 条展开记录未复制`);
    }
  }

  appendReportUnresolvedSection(lines, reportView.unresolvedCandidates);
  if (reportView.isUnresolvedTruncated) {
    lines.push(`- 还有 ${reportView.filteredUnresolvedCount - reportView.unresolvedCandidates.length} 条未展开线索未复制`);
  }

  appendReportPlaceholderSection(lines, reportView.runtimePlaceholderGroups, reportView.runtimePlaceholders);
  if (reportView.isPlaceholderTruncated) {
    lines.push(`- 还有 ${reportView.filteredPlaceholderCount - reportView.runtimePlaceholders.length} 个运行时占位符未复制`);
  }

  appendReportWarningSection(lines, reportView.warnings);
  if (reportView.isWarningTruncated) {
    lines.push(`- 还有 ${reportView.filteredWarningCount - reportView.warnings.length} 条跳过记录未复制`);
  }

  return lines.join('\n');
};
