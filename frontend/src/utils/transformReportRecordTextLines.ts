import { formatSourceLabelText } from './sourceLabels';
import type { TransformReportRecord } from './transformSummary';

export interface TransformReportRecordTextOptions {
  commandSchemaRowLimit: number;
  formatDecodedPathCount: (record: Pick<
    TransformReportRecord,
    'decodedPathCount' | 'isDecodedPathCountTruncated'
  >) => string;
}

export const appendReportRecordLines = (
  lines: string[],
  records: TransformReportRecord[],
  options: TransformReportRecordTextOptions
) => {
  if (records.length === 0) {
    lines.push('- 无');
    return;
  }

  records.forEach(record => {
    lines.push(`- ${record.path}: ${record.labels.join(' -> ')}`);
    if (record.sourceLabel) {
      lines.push(`  ${formatSourceLabelText(record.sourceLabel)}`);
    }
    if (record.decodedPreview) {
      lines.push(`  解析结果: ${record.decodedPreview}`);
    }
    if (record.insights.length > 0) {
      lines.push(`  解析线索: ${record.insights.join('；')}`);
    }
    if (record.commandParamCount !== undefined) {
      const visibleKeys = record.commandParamKeys || [];
      const hiddenKeyCount = Math.max(record.commandParamCount - visibleKeys.length, 0);
      lines.push(
        `  cmdParams: ${record.commandParamCount} 个顶层参数${
          visibleKeys.length > 0
            ? `（${visibleKeys.join(', ')}${hiddenKeyCount > 0 ? ` ... +${hiddenKeyCount}` : ''}）`
            : ''
        }`
      );
    }
    if (record.schemeParamStageSummary) {
      const visibleKeys = record.schemeParamStageSummary.keys.map(bucket => bucket.key);
      const hiddenKeyCount = Math.max(record.schemeParamStageSummary.total - visibleKeys.length, 0);
      lines.push(
        `  参数分层: ${record.schemeParamStageSummary.total} 个${
          visibleKeys.length > 0
            ? `（${visibleKeys.join(', ')}${hiddenKeyCount > 0 ? ` ... +${hiddenKeyCount}` : ''}）`
            : ''
        }`
      );
      if (record.schemeParamStageSummary.repairHints > 0) {
        lines.push(`  参数修复提示: ${record.schemeParamStageSummary.repairHints}`);
      }
      if (record.schemeParamStageSummary.nonReversible > 0) {
        lines.push(`  参数不可回写: ${record.schemeParamStageSummary.nonReversible}`);
      }
    }
    if (record.commandSchemaRows?.length) {
      const rows = record.commandSchemaRows.slice(0, options.commandSchemaRowLimit);
      lines.push(`  CMD Schema路径: ${rows.map(row => `${row.path}=${row.schema}`).join('；')}`);
      if (record.commandSchemaRows.length > rows.length) {
        lines.push(`  CMD Schema路径: 还有更多未展示（总计 ${record.commandSchemaRows.length} 条）`);
      }
    }
    if (record.nestedCommandFields.length > 0) {
      lines.push(`  内部CMD字段: ${record.nestedCommandFields.map(row => `${row.path}=${row.preview}`).join('；')}`);
    }
    if (record.hasMoreNestedCommandFields) {
      lines.push(
        `  内部CMD字段: 还有更多未展示（总计 ${record.nestedCommandFieldCount} 个，已索引 ${record.indexedNestedCommandFieldCount} 个）`
      );
    }
    if (record.nestedResourceFields?.length) {
      lines.push(`  资源URL字段: ${record.nestedResourceFields.map(row => `${row.path}=${row.preview}`).join('；')}`);
    }
    if (record.hasMoreNestedResourceFields) {
      lines.push(
        `  资源URL字段: 还有更多未展示（总计 ${record.nestedResourceFieldCount || 0} 个，已索引 ${record.indexedNestedResourceFieldCount || 0} 个）`
      );
    }
    if (record.decodedPaths.length > 0) {
      lines.push(`  内部路径: ${record.decodedPaths.map(row => `${row.path}=${row.preview}`).join('；')}`);
    }
    if (record.hasMoreDecodedPaths) {
      lines.push(`  内部路径: 还有更多未展示（总计 ${options.formatDecodedPathCount(record)} 条）`);
    }
  });
};
