import type {
  TransformIssueSampleExportItem,
  TransformReportView,
} from './transformSummary';
import type { TransformIssueSampleExportSummary } from './transformSummaryIssueSampleTypes';

export const collectRuntimePlaceholderIssueSamples = (
  reportView: TransformReportView
): TransformIssueSampleExportItem[] => reportView.runtimePlaceholders
  .filter(placeholder => Boolean(placeholder.sourceOriginalValue))
  .map(placeholder => ({
    type: 'runtime_placeholder' as const,
    path: placeholder.path,
    sourcePath: placeholder.sourcePath,
    ...(placeholder.sourceLabel ? { sourceLabel: placeholder.sourceLabel } : {}),
    originalValue: placeholder.sourceOriginalValue || '',
    reasonLabel: '运行时占位符',
    message: placeholder.description,
    value: placeholder.value,
  }));

export const collectTransformIssueSamples = (
  reportView: TransformReportView,
  runtimePlaceholderSamples = collectRuntimePlaceholderIssueSamples(reportView)
): TransformIssueSampleExportItem[] => [
  ...reportView.unresolvedCandidates.map(candidate => ({
    type: 'unresolved' as const,
    path: candidate.path,
    ...(candidate.sourceLabel ? { sourceLabel: candidate.sourceLabel } : {}),
    originalValue: candidate.originalValue,
    reasonLabel: candidate.reasonLabel,
    nextAction: candidate.nextAction,
    message: candidate.message,
    ...(candidate.detectedType ? { detectedType: candidate.detectedType } : {}),
    reasonLevel: candidate.reasonLevel,
    length: candidate.length,
  })),
  ...runtimePlaceholderSamples,
  ...reportView.warnings.map(warning => ({
    type: 'warning' as const,
    path: warning.path,
    ...(warning.sourceLabel ? { sourceLabel: warning.sourceLabel } : {}),
    originalValue: warning.originalValue,
    reasonLabel: warning.reasonLabel,
    nextAction: warning.nextAction,
    message: warning.message,
    length: warning.length,
    limit: warning.limit,
    warningType: warning.type,
  })),
];

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
