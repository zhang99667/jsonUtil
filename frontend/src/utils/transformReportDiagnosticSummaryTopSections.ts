import type {
  TransformContextReport,
  TransformReportView,
} from './transformSummaryTypes';
import { buildSchemeParamStageQualityBuckets } from './transformSchemeParamStages';
import { formatResourceSchemaGroupTitle } from './transformReportTextSections';

const DIAGNOSTIC_TOP_LIMIT = 8;

export const appendDiagnosticSummaryTopSections = (
  lines: string[],
  report: TransformContextReport,
  reportView: TransformReportView
) => {
  if (report.topCommandSchemas?.length) {
    lines.push('', '全量 CMD Schema Top:');
    report.topCommandSchemas.slice(0, DIAGNOSTIC_TOP_LIMIT).forEach(group => {
      lines.push(`- ${group.schema} ×${group.count}（来源记录 ${group.recordCount}）`);
    });
  }

  if (report.topResourceSchemas?.length) {
    lines.push('', '全量静态资源 URL Top:');
    report.topResourceSchemas.slice(0, DIAGNOSTIC_TOP_LIMIT).forEach(group => {
      lines.push(`- ${formatResourceSchemaGroupTitle(group)} ×${group.count}（来源记录 ${group.recordCount}）`);
    });
  }

  if (report.topResourceTypes?.length) {
    lines.push('', '全量静态资源类型 Top:');
    report.topResourceTypes.slice(0, DIAGNOSTIC_TOP_LIMIT).forEach(group => {
      lines.push(`- ${group.resourceTypeLabel} ${group.percentage}% ×${group.count}（URL ${group.schemaCount} / 来源记录 ${group.recordCount}）`);
    });
  }

  if (report.topNestedCommandFields?.length) {
    lines.push('', '全量内部 CMD 字段 Top:');
    report.topNestedCommandFields.slice(0, DIAGNOSTIC_TOP_LIMIT).forEach(group => {
      lines.push(`- ${group.key} ×${group.count}（来源记录 ${group.recordCount}）`);
    });
  }

  if (report.topNestedResourceFields?.length) {
    lines.push('', '全量静态资源字段 Top:');
    report.topNestedResourceFields.slice(0, DIAGNOSTIC_TOP_LIMIT).forEach(group => {
      lines.push(`- ${group.key} ×${group.count}（来源记录 ${group.recordCount}）`);
    });
  }

  if (reportView.runtimePlaceholderGroups.length > 0) {
    lines.push('', '当前占位符 Top:');
    reportView.runtimePlaceholderGroups.slice(0, DIAGNOSTIC_TOP_LIMIT).forEach(group => {
      lines.push(`- ${group.value} ×${group.count}（来源 ${group.sourceCount}）`);
    });
  }

  const paramStageRepairHintBuckets = buildSchemeParamStageQualityBuckets(
    reportView.records,
    summary => summary.repairHintLabels
  );
  const paramStageKeyBuckets = buildSchemeParamStageQualityBuckets(
    reportView.records,
    summary => summary.keys
  );
  if (paramStageRepairHintBuckets.length > 0) {
    lines.push('', '当前参数分层修复 Top:');
    paramStageRepairHintBuckets.slice(0, DIAGNOSTIC_TOP_LIMIT).forEach(bucket => {
      lines.push(`- ${bucket.key} ×${bucket.count}（来源 ${bucket.paths.length}）`);
    });
  } else if (paramStageKeyBuckets.length > 0) {
    lines.push('', '当前参数分层 Key Top:');
    paramStageKeyBuckets.slice(0, DIAGNOSTIC_TOP_LIMIT).forEach(bucket => {
      lines.push(`- ${bucket.key} ×${bucket.count}（来源 ${bucket.paths.length}）`);
    });
  }
};
