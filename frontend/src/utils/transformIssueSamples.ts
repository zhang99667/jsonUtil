import { APP_VERSION_METADATA } from './appVersion';
import { redactSensitiveIssueSamples } from './issueSampleRedaction';
import { formatIssueSampleFilter } from './transformIssueSampleReportText';
import { buildIssueSampleSuggestedCommands } from './transformSuggestedCommands';
import type {
  TransformIssueSampleExport,
  TransformIssueSampleExportItem,
  TransformIssueSampleJsonOptions,
  TransformReportView,
} from './transformSummary';

export { formatTransformIssueSampleReportText } from './transformIssueSampleReportText';

export const buildTransformIssueSampleExport = (
  reportView: TransformReportView,
  options: TransformIssueSampleJsonOptions = {}
): TransformIssueSampleExport | null => {
  const placeholderSamples = reportView.runtimePlaceholders.filter(
    placeholder => Boolean(placeholder.sourceOriginalValue)
  );
  const samples: TransformIssueSampleExportItem[] = [
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
    ...placeholderSamples.map(placeholder => ({
      type: 'runtime_placeholder' as const,
      path: placeholder.path,
      sourcePath: placeholder.sourcePath,
      ...(placeholder.sourceLabel ? { sourceLabel: placeholder.sourceLabel } : {}),
      originalValue: placeholder.sourceOriginalValue || '',
      reasonLabel: '运行时占位符',
      message: placeholder.description,
      value: placeholder.value,
    })),
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

  if (samples.length === 0) {
    return null;
  }

  const outputSamples = options.redactSensitiveValues
    ? redactSensitiveIssueSamples(samples)
    : samples;

  return {
    schemaVersion: 1,
    kind: 'json-helper-transform-issue-samples',
    tool: APP_VERSION_METADATA,
    filter: formatIssueSampleFilter(options.filter),
    suggestedCommands: buildIssueSampleSuggestedCommands(),
    summary: {
      unresolved: {
        copied: reportView.unresolvedCandidates.length,
        filtered: reportView.filteredUnresolvedCount,
        total: reportView.totalUnresolvedCount,
        truncated: reportView.isUnresolvedTruncated,
      },
      runtimePlaceholders: {
        copied: placeholderSamples.length,
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
    },
    samples: outputSamples,
  };
};

export const formatTransformIssueSampleJsonText = (
  reportView: TransformReportView,
  options: TransformIssueSampleJsonOptions = {}
): string => {
  const sampleExport = buildTransformIssueSampleExport(reportView, options);
  return sampleExport ? JSON.stringify(sampleExport, null, 2) : '';
};
