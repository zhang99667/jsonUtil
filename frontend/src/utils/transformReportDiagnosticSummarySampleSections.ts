import { getSourceLabelDisplayValue } from './sourceLabels';
import type { TransformReportView } from './transformSummaryTypes';

const DIAGNOSTIC_SAMPLE_LIMIT = 5;

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
