import type { TransformReportCmdComparisonState } from './transformReportCmdComparisonController';
import type { TransformReportPanelCopyWorkflowState } from './transformReportPanelCopyWorkflowStateTypes';

type TransformReportPanelCopyWorkflowStateSource = Omit<
  TransformReportPanelCopyWorkflowState,
  | 'cmdComparisonExpectedText'
  | 'cmdComparisonIgnoreExtraPaths'
  | 'cmdComparisonActualCandidate'
> & {
  cmdComparisonState: Pick<
    TransformReportCmdComparisonState,
    'expectedText' | 'ignoreExtraPaths' | 'actualCandidate'
  >;
};

export const buildTransformReportPanelCopyWorkflowState = ({
  activeContext,
  report,
  reportView,
  deferredQuery,
  isFilterPending,
  qualitySnapshot,
  qualityBaselineDeltaText,
  placeholderFillTemplateJsonText,
  issueSampleCopyText,
  issueSampleJsonCopyText,
  redactedIssueSampleJsonCopyText,
  issueRegressionTemplateCopyText,
  hasPathValueCopyItems,
  hasCmdStructureCopyItems,
  hasFocusedCmdStructureCopyItems,
  cmdComparisonState,
}: TransformReportPanelCopyWorkflowStateSource): TransformReportPanelCopyWorkflowState => ({
  activeContext,
  report,
  reportView,
  deferredQuery,
  isFilterPending,
  qualitySnapshot,
  qualityBaselineDeltaText,
  placeholderFillTemplateJsonText,
  issueSampleCopyText,
  issueSampleJsonCopyText,
  redactedIssueSampleJsonCopyText,
  issueRegressionTemplateCopyText,
  hasPathValueCopyItems,
  hasCmdStructureCopyItems,
  hasFocusedCmdStructureCopyItems,
  cmdComparisonExpectedText: cmdComparisonState.expectedText,
  cmdComparisonIgnoreExtraPaths: cmdComparisonState.ignoreExtraPaths,
  cmdComparisonActualCandidate: cmdComparisonState.actualCandidate,
});
