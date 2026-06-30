import type {
  TransformReportSectionVisibility,
  TransformReportSectionVisibilityInput,
} from './transformReportSectionVisibilityTypes';
import {
  buildTransformReportVisibleSectionFlags,
  hasVisibleTransformReportSection,
  HIDDEN_TRANSFORM_REPORT_SECTION_VISIBILITY,
} from './transformReportVisibleSections';

export type {
  TransformReportSectionVisibility,
  TransformReportSectionVisibilityInput,
} from './transformReportSectionVisibilityTypes';

export const buildTransformReportSectionVisibility = (
  reportView: TransformReportSectionVisibilityInput | null | undefined,
): TransformReportSectionVisibility => {
  if (!reportView) return HIDDEN_TRANSFORM_REPORT_SECTION_VISIBILITY;

  const visibleSections = buildTransformReportVisibleSectionFlags(reportView);
  return {
    ...visibleSections,
    showEmptyState: !hasVisibleTransformReportSection(visibleSections),
  };
};
