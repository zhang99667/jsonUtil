import {
  buildTransformPlaceholderFillTemplate,
  buildTransformQualitySnapshot,
  formatTransformIssueRegressionTemplateText,
  formatTransformIssueSampleJsonText,
  formatTransformIssueSampleReportText,
  formatTransformQualitySnapshotDeltaText,
  getTransformPathValueCopyRows,
  type TransformContextReport,
  type TransformPlaceholderFillTemplate,
  type TransformQualitySnapshot,
  type TransformReportView,
} from './transformSummary';
import { buildPlaceholderFillSummary } from './transformReportPlaceholderFillSummary';
import type { PlaceholderFillSummary } from './transformReportPlaceholderFillSummary';
import type { TransformReportQualityBaseline } from './transformReportPanelCopyWorkflow';

export interface TransformReportPanelCopyAvailability {
  hasPathValueCopyItems: boolean;
  hasCmdStructureCopyItems: boolean;
  hasFocusedCmdStructureCopyItems: boolean;
}

export interface TransformReportPanelIssueCopyTexts {
  issueSampleCopyText: string;
  issueSampleJsonCopyText: string;
  redactedIssueSampleJsonCopyText: string;
  issueRegressionTemplateCopyText: string;
}

export interface TransformReportPanelPlaceholderFillState {
  placeholderFillTemplate: TransformPlaceholderFillTemplate | null;
  placeholderFillTemplateSummary: PlaceholderFillSummary | null;
  placeholderFillTemplateJsonText: string;
}

export interface TransformReportPanelQualityState {
  qualitySnapshot: TransformQualitySnapshot | null;
  qualityBaselineDeltaText: string;
}

export const buildTransformReportPanelCopyAvailability = (
  reportView: TransformReportView | null
): TransformReportPanelCopyAvailability => ({
  hasPathValueCopyItems: Boolean(reportView?.records.some(record => (
    getTransformPathValueCopyRows(record).length > 0
  ))),
  hasCmdStructureCopyItems: Boolean(reportView && reportView.filteredCmdStructureCount > 0),
  hasFocusedCmdStructureCopyItems: Boolean(reportView?.cmdStructureRecords.some(
    record => record.cmdStructureFocusPaths?.length
  )),
});

export const buildTransformReportPanelIssueCopyTexts = (
  reportView: TransformReportView | null,
  filter: string
): TransformReportPanelIssueCopyTexts => {
  if (!reportView) {
    return {
      issueSampleCopyText: '',
      issueSampleJsonCopyText: '',
      redactedIssueSampleJsonCopyText: '',
      issueRegressionTemplateCopyText: '',
    };
  }

  return {
    issueSampleCopyText: formatTransformIssueSampleReportText(reportView, filter),
    issueSampleJsonCopyText: formatTransformIssueSampleJsonText(reportView, { filter }),
    redactedIssueSampleJsonCopyText: formatTransformIssueSampleJsonText(reportView, {
      redactSensitiveValues: true,
      filter,
    }),
    issueRegressionTemplateCopyText: formatTransformIssueRegressionTemplateText(reportView, {
      redactSensitiveValues: true,
      filter,
    }),
  };
};

export const buildTransformReportPanelPlaceholderFillState = (
  reportView: TransformReportView | null,
  fullReportView: TransformReportView | null,
  filter: string
): TransformReportPanelPlaceholderFillState => {
  const placeholderFillTemplate = reportView
    ? buildTransformPlaceholderFillTemplate(reportView, filter, fullReportView || reportView)
    : null;

  return {
    placeholderFillTemplate,
    placeholderFillTemplateSummary: buildPlaceholderFillSummary(placeholderFillTemplate),
    placeholderFillTemplateJsonText: placeholderFillTemplate
      ? JSON.stringify(placeholderFillTemplate, null, 2)
      : '',
  };
};

export const buildTransformReportPanelQualityState = (
  report: TransformContextReport | null,
  reportView: TransformReportView | null,
  filter: string,
  qualityBaseline: TransformReportQualityBaseline | null
): TransformReportPanelQualityState => {
  const qualitySnapshot = report && reportView
    ? buildTransformQualitySnapshot(report, reportView, filter)
    : null;

  return {
    qualitySnapshot,
    qualityBaselineDeltaText: qualityBaseline && qualitySnapshot
      ? formatTransformQualitySnapshotDeltaText(qualityBaseline.snapshot, qualitySnapshot)
      : '',
  };
};
