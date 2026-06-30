export interface TransformReportSectionVisibilityInput {
  filteredRecordCount: number;
  filteredUnresolvedCount: number;
  filteredPlaceholderCount: number;
  filteredWarningCount: number;
}

export interface TransformReportVisibleSectionFlags {
  showRecords: boolean;
  showUnresolved: boolean;
  showPlaceholders: boolean;
  showWarnings: boolean;
}

export interface TransformReportSectionVisibility extends TransformReportVisibleSectionFlags {
  showEmptyState: boolean;
}
