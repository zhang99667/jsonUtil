import type {
  TransformReportSectionVisibility,
  TransformReportSectionVisibilityInput,
  TransformReportVisibleSectionFlags,
} from './transformReportSectionVisibilityTypes';

export const HIDDEN_TRANSFORM_REPORT_SECTION_VISIBILITY: TransformReportSectionVisibility = {
  showRecords: false,
  showUnresolved: false,
  showPlaceholders: false,
  showWarnings: false,
  showEmptyState: false,
};

export const buildTransformReportVisibleSectionFlags = (
  reportView: TransformReportSectionVisibilityInput,
): TransformReportVisibleSectionFlags => ({
  showRecords: reportView.filteredRecordCount > 0,
  showUnresolved: reportView.filteredUnresolvedCount > 0,
  showPlaceholders: reportView.filteredPlaceholderCount > 0,
  showWarnings: reportView.filteredWarningCount > 0,
});

export const hasVisibleTransformReportSection = (
  visibleSections: TransformReportVisibleSectionFlags,
): boolean => (
  visibleSections.showRecords ||
  visibleSections.showUnresolved ||
  visibleSections.showPlaceholders ||
  visibleSections.showWarnings
);
