import type { TransformReportCopyTitles } from './transformReportCopyTitles';
import {
  buildTransformReportFooterActionHandlers,
  buildTransformReportFooterActions,
  type TransformReportFooterAction,
  type TransformReportFooterActionHandlers,
} from './transformReportFooterActions';
import type { TransformReportPanelCopyWorkflow } from './transformReportPanelCopyWorkflow';

interface TransformReportPanelFooterModelInput {
  query: string;
  hasReportView: boolean;
  isFilterPending: boolean;
  hasQualitySnapshot: boolean;
  qualityBaselineFilter: string | null;
  hasQualityBaselineDeltaText: boolean;
  hasPathValueCopyItems: boolean;
  hasCmdStructureCopyItems: boolean;
  hasFocusedCmdStructureCopyItems: boolean;
  hasIssueSampleCopyText: boolean;
  hasIssueSampleJsonCopyText: boolean;
  hasRedactedIssueSampleJsonCopyText: boolean;
  hasIssueRegressionTemplateCopyText: boolean;
  hasActiveContext: boolean;
  copyTitles: TransformReportCopyTitles;
  copyWorkflow: TransformReportPanelCopyWorkflow;
}

export interface TransformReportPanelFooterModel {
  footerActions: TransformReportFooterAction[];
  footerActionHandlers: TransformReportFooterActionHandlers;
}

export const buildTransformReportPanelFooterModel = ({
  query,
  hasReportView,
  isFilterPending,
  hasQualitySnapshot,
  qualityBaselineFilter,
  hasQualityBaselineDeltaText,
  hasPathValueCopyItems,
  hasCmdStructureCopyItems,
  hasFocusedCmdStructureCopyItems,
  hasIssueSampleCopyText,
  hasIssueSampleJsonCopyText,
  hasRedactedIssueSampleJsonCopyText,
  hasIssueRegressionTemplateCopyText,
  hasActiveContext,
  copyTitles,
  copyWorkflow,
}: TransformReportPanelFooterModelInput): TransformReportPanelFooterModel => ({
  footerActions: buildTransformReportFooterActions({
    hasQuery: Boolean(query.trim()),
    hasReportView,
    isFilterPending,
    hasQualitySnapshot,
    qualityBaselineFilter,
    hasQualityBaselineDeltaText,
    hasPathValueCopyItems,
    hasCmdStructureCopyItems,
    hasFocusedCmdStructureCopyItems,
    hasIssueSampleCopyText,
    hasIssueSampleJsonCopyText,
    hasRedactedIssueSampleJsonCopyText,
    hasIssueRegressionTemplateCopyText,
    hasActiveContext,
    copyTitles,
  }),
  footerActionHandlers: buildTransformReportFooterActionHandlers({
    copyFilteredReport: copyWorkflow.copyFilteredReport,
    copyCollaborationReport: copyWorkflow.copyCollaborationReport,
    copyDiagnosticSummary: copyWorkflow.copyDiagnosticSummary,
    copyQualitySnapshot: copyWorkflow.copyQualitySnapshot,
    setQualityBaseline: copyWorkflow.setQualityBaseline,
    copyQualityBaselineDelta: copyWorkflow.copyQualityBaselineDelta,
    clearQualityBaseline: copyWorkflow.clearQualityBaseline,
    copyArchivePackage: copyWorkflow.copyArchivePackage,
    copyTroubleshootingRecipe: copyWorkflow.copyTroubleshootingRecipe,
    copyPathValueReport: copyWorkflow.copyPathValueReport,
    copyCmdStructureReport: copyWorkflow.copyCmdStructureReport,
    copyIssueSamples: copyWorkflow.copyIssueSamples,
    copyIssueSampleJson: copyWorkflow.copyIssueSampleJson,
    copyRedactedIssueSampleJson: copyWorkflow.copyRedactedIssueSampleJson,
    copyIssueRegressionTemplate: copyWorkflow.copyIssueRegressionTemplate,
    copyFullReport: copyWorkflow.copyReport,
  }),
});
