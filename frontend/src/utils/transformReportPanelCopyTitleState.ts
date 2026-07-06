import {
  buildTransformReportCopyTitles,
  type TransformReportCopyTitleState,
  type TransformReportCopyTitles,
} from './transformReportCopyTitles';
import type {
  TransformReportPanelCopyAvailability,
  TransformReportPanelIssueCopyTexts,
  TransformReportPanelQualityState,
} from './transformReportPanelDerivedValues';

interface TransformReportPanelCopyTitleStateInput {
  hasReportView: boolean;
  isFilterPending: boolean;
  hasActiveContext: boolean;
  copyAvailability: TransformReportPanelCopyAvailability;
  issueCopyTexts: TransformReportPanelIssueCopyTexts;
  qualityState: TransformReportPanelQualityState;
}

export const buildTransformReportPanelCopyTitleState = ({
  hasReportView,
  isFilterPending,
  hasActiveContext,
  copyAvailability,
  issueCopyTexts,
  qualityState,
}: TransformReportPanelCopyTitleStateInput): TransformReportCopyTitleState => ({
  hasReportView,
  isFilterPending,
  hasFilteredReport: hasReportView,
  hasQualityBaselineDeltaText: Boolean(qualityState.qualityBaselineDeltaText),
  ...copyAvailability,
  hasIssueSampleCopyText: Boolean(issueCopyTexts.issueSampleCopyText),
  hasIssueSampleJsonCopyText: Boolean(issueCopyTexts.issueSampleJsonCopyText),
  hasRedactedIssueSampleJsonCopyText: Boolean(issueCopyTexts.redactedIssueSampleJsonCopyText),
  hasIssueRegressionTemplateCopyText: Boolean(issueCopyTexts.issueRegressionTemplateCopyText),
  hasActiveContext,
});

export const buildTransformReportPanelCopyTitles = (
  input: TransformReportPanelCopyTitleStateInput
): TransformReportCopyTitles => buildTransformReportCopyTitles(
  buildTransformReportPanelCopyTitleState(input)
);
