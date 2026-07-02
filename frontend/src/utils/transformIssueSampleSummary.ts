import type { TransformReportView } from './transformSummary';
import type { TransformIssueSampleExportSummary } from './transformSummaryIssueSampleTypes';

export const buildTransformIssueSampleSummary = (
  reportView: TransformReportView,
  runtimePlaceholderSampleCount: number
): TransformIssueSampleExportSummary => ({
  unresolved: {
    copied: reportView.unresolvedCandidates.length,
    filtered: reportView.filteredUnresolvedCount,
    total: reportView.totalUnresolvedCount,
    truncated: reportView.isUnresolvedTruncated,
  },
  runtimePlaceholders: {
    copied: runtimePlaceholderSampleCount,
    filtered: reportView.filteredPlaceholderCount,
    total: reportView.totalPlaceholderCount,
    truncated: reportView.isPlaceholderTruncated,
  },
  warnings: {
    copied: reportView.warnings.length,
    filtered: reportView.filteredWarningCount,
    total: reportView.totalWarningCount,
    truncated: reportView.isWarningTruncated,
  },
});
