import { getSourceLabelDisplayValue } from './sourceLabels';
import type {
  TransformContextReport,
  TransformReportView,
} from './transformSummaryTypes';
import { buildSchemeParamStageQualityBuckets } from './transformSchemeParamStages';
import { formatResourceSchemaGroupTitle } from './transformReportTextSections';

const DIAGNOSTIC_TOP_LIMIT = 8;
const DIAGNOSTIC_SAMPLE_LIMIT = 5;

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

export const appendDiagnosticSummarySampleSections = (
  lines: string[],
  reportView: TransformReportView
) => {
  if (reportView.unresolvedCandidates.length > 0) {
    lines.push('', '当前待检查样例:');
    reportView.unresolvedCandidates.slice(0, DIAGNOSTIC_SAMPLE_LIMIT).forEach(candidate => {
      const sourceLabel = candidate.sourceLabel ? ` · ${getSourceLabelDisplayValue(candidate.sourceLabel)}` : '';
      const detectedType = candidate.detectedType ? ` · ${candidate.detectedType}` : '';
      lines.push(`- ${candidate.path}${sourceLabel}${detectedType}: ${candidate.reasonLabel}`);
    });
    if (reportView.isUnresolvedTruncated) {
      lines.push(`- 还有 ${reportView.filteredUnresolvedCount - reportView.unresolvedCandidates.length} 条待检查未列出`);
    }
  }

  if (reportView.warnings.length > 0) {
    lines.push('', '当前跳过样例:');
    reportView.warnings.slice(0, DIAGNOSTIC_SAMPLE_LIMIT).forEach(warning => {
      const sourceLabel = warning.sourceLabel ? ` · ${getSourceLabelDisplayValue(warning.sourceLabel)}` : '';
      lines.push(`- ${warning.path}${sourceLabel}: ${warning.reasonLabel} (${warning.length}/${warning.limit})`);
    });
    if (reportView.isWarningTruncated) {
      lines.push(`- 还有 ${reportView.filteredWarningCount - reportView.warnings.length} 条跳过记录未列出`);
    }
  }
};

export const appendDiagnosticSummaryRecommendationSection = (
  lines: string[],
  reportView: TransformReportView
) => {
  lines.push('', '建议:');
  if (reportView.filteredWarningCount > 0) {
    lines.push('- 先处理跳过记录，超长字段可单独粘贴到 Scheme 面板或缩小 response 后再解析');
  }
  if (reportView.filteredUnresolvedCount > 0) {
    lines.push('- 对待检查项判断是否为规则缺口；确认后可复制样本 JSON 并生成回归模板');
  }
  if (reportView.filteredPlaceholderCount > 0) {
    lines.push('- 运行时占位符通常不是解析失败，可按来源路径确认实际替换链路');
  }
  if (reportView.filteredSchemeParamStageRepairHintCount > 0) {
    lines.push('- 参数分层存在修复提示，建议核对原始值、URL Decode、JSON 解析链路后沉淀回归样本');
  }
  if (reportView.filteredNonReversibleParamStageCount > 0) {
    lines.push('- 存在不可回写参数层，复制回写前需确认该字段是否只用于只读排查');
  }
  if (
    reportView.filteredWarningCount === 0 &&
    reportView.filteredUnresolvedCount === 0 &&
    reportView.filteredPlaceholderCount === 0 &&
    reportView.filteredSchemeParamStageRepairHintCount === 0 &&
    reportView.filteredNonReversibleParamStageCount === 0
  ) {
    lines.push('- 当前筛选未发现跳过、待检查或运行时占位符，可重点核对 CMD Schema 与业务预期是否一致');
  }
};
