import type { TransformQualitySnapshot, TransformReportView } from './transformSummary';

export const buildQualitySnapshotTotals = (
  reportView: TransformReportView
): TransformQualitySnapshot['totals'] => ({
  records: reportView.totalRecordCount,
  cmdStructures: reportView.totalCmdStructureCount,
  nestedCommandFields: reportView.totalNestedCommandFieldCount,
  nestedResourceFields: reportView.totalNestedResourceFieldCount,
  runtimePlaceholders: reportView.totalPlaceholderCount,
  schemeParamStages: reportView.totalSchemeParamStageCount,
  schemeParamStageRepairHints: reportView.totalSchemeParamStageRepairHintCount,
  nonReversibleParamStages: reportView.totalNonReversibleParamStageCount,
  unresolved: reportView.totalUnresolvedCount,
  warnings: reportView.totalWarningCount,
});

export const buildQualitySnapshotFiltered = (
  reportView: TransformReportView
): TransformQualitySnapshot['filtered'] => ({
  records: reportView.filteredRecordCount,
  cmdStructures: reportView.filteredCmdStructureCount,
  nestedCommandFields: reportView.filteredNestedCommandFieldCount,
  nestedResourceFields: reportView.filteredNestedResourceFieldCount,
  runtimePlaceholders: reportView.filteredPlaceholderCount,
  schemeParamStages: reportView.filteredSchemeParamStageCount,
  schemeParamStageRepairHints: reportView.filteredSchemeParamStageRepairHintCount,
  nonReversibleParamStages: reportView.filteredNonReversibleParamStageCount,
  unresolved: reportView.filteredUnresolvedCount,
  warnings: reportView.filteredWarningCount,
});

export const buildQualitySnapshotTruncation = (
  reportView: TransformReportView
): TransformQualitySnapshot['truncation'] => ({
  records: reportView.isRecordTruncated,
  cmdStructures: reportView.isCmdStructureTruncated,
  runtimePlaceholders: reportView.isPlaceholderTruncated,
  unresolved: reportView.isUnresolvedTruncated,
  warnings: reportView.isWarningTruncated,
});
