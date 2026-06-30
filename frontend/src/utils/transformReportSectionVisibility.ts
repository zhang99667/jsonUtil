export interface TransformReportSectionVisibilityInput {
  filteredRecordCount: number;
  filteredUnresolvedCount: number;
  filteredPlaceholderCount: number;
  filteredWarningCount: number;
}

export interface TransformReportSectionVisibility {
  showRecords: boolean;
  showUnresolved: boolean;
  showPlaceholders: boolean;
  showWarnings: boolean;
  showEmptyState: boolean;
}

const HIDDEN_SECTION_VISIBILITY: TransformReportSectionVisibility = {
  showRecords: false,
  showUnresolved: false,
  showPlaceholders: false,
  showWarnings: false,
  showEmptyState: false,
};

export const buildTransformReportSectionVisibility = (
  reportView: TransformReportSectionVisibilityInput | null | undefined,
): TransformReportSectionVisibility => {
  if (!reportView) return HIDDEN_SECTION_VISIBILITY;

  const showRecords = reportView.filteredRecordCount > 0;
  const showUnresolved = reportView.filteredUnresolvedCount > 0;
  const showPlaceholders = reportView.filteredPlaceholderCount > 0;
  const showWarnings = reportView.filteredWarningCount > 0;

  return {
    showRecords,
    showUnresolved,
    showPlaceholders,
    showWarnings,
    showEmptyState: !showRecords && !showUnresolved && !showPlaceholders && !showWarnings,
  };
};
