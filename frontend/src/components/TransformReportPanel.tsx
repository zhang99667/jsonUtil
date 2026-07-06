import React from 'react';
import toast from 'react-hot-toast';
import type { TransformContext } from '../types';
import { copyText, getClipboardErrorMessage } from '../utils/clipboard';
import { formatTransformReportFooterSummary } from '../utils/transformReportFooterSummary';
import {
  buildTransformReportActionRunners,
} from '../utils/transformReportActionItems';
import { buildTransformReportPanelCopyWorkflowModel } from '../utils/transformReportPanelCopyWorkflowModel';
import { buildTransformReportPanelCopyWorkflowState } from '../utils/transformReportPanelCopyWorkflowState';
import { buildTransformReportPanelSectionModel } from '../utils/transformReportPanelSectionModel';
import { buildTransformReportPanelFooterModel } from '../utils/transformReportPanelFooterModel';
import { TransformReportPanelContent } from './TransformReportPanelContent';
import { TransformReportPanelFrame } from './TransformReportPanelFrame';
import { buildTransformReportRecordSectionBindings } from './transformReportRecordSectionBindings';
import { useTransformReportPanelViewModel } from './useTransformReportPanelViewModel';

interface TransformReportPanelProps {
  isOpen: boolean;
  onClose: () => void;
  context: TransformContext | null;
  onLocatePath?: (path: string) => void;
  onOpenSchemeValue?: (value: string) => void;
  onOpenTemplateFill?: (template: string) => void;
}

export const TransformReportPanel: React.FC<TransformReportPanelProps> = ({
  isOpen,
  onClose,
  context,
  onLocatePath,
  onOpenSchemeValue,
  onOpenTemplateFill,
}) => {
  const model = useTransformReportPanelViewModel({ isOpen, context });
  const showCopyError = (message: string, error: unknown) => {
    console.warn(message, error);
    toast.error(getClipboardErrorMessage(error), { duration: 2000 });
  };

  const {
    copyWorkflow,
    getCmdComparisonCandidateRecords,
  } = buildTransformReportPanelCopyWorkflowModel({
    copyWorkflowState: buildTransformReportPanelCopyWorkflowState(model),
    cmdComparisonState: model.cmdComparisonState,
    fullReportView: model.fullReportView,
    effects: {
      copyText,
      showSuccess: (message, toastOptions) => toast.success(message, toastOptions),
      showError: showCopyError,
      setQualityBaseline: model.setQualityBaseline,
      showStatusSuccess: (message, toastOptions) => toast.success(message, toastOptions),
      openTemplateFill: onOpenTemplateFill,
    },
  });

  const {
    openFirstCmdComparison,
    recordActions,
    recordCmdComparison,
  } = buildTransformReportRecordSectionBindings({
    copyWorkflow,
    cmdComparisonState: model.cmdComparisonState,
    setCmdComparisonState: model.setCmdComparisonState,
    setQuery: model.setQuery,
    firstCmdStructureRecord: model.reportView?.cmdStructureRecords[0],
    getCandidateRecords: getCmdComparisonCandidateRecords,
    onLocatePath,
    onOpenSchemeValue,
  });

  const sectionModel = buildTransformReportPanelSectionModel({
    report: model.report,
    reportView: model.reportView,
    isFilterPending: model.isFilterPending,
    hasTemplateFillTarget: Boolean(onOpenTemplateFill),
    hasPlaceholderFillTemplate: Boolean(model.placeholderFillTemplateJsonText),
    formatPlaceholderFillTitle: model.getPanelPlaceholderFillTemplateTitle,
    archivePackageTitle: model.copyTitles.archivePackage,
    collaborationReportTitle: model.copyTitles.collaborationReport,
    qualitySnapshotTitle: model.copyTitles.qualitySnapshot,
  });
  const {
    placeholderFillPanelTitle,
    canOpenPlaceholderFill,
    placeholderToolbarState,
    sectionVisibility,
    issuePriorityCount,
    issueTriageItems,
    nextActions,
  } = sectionModel;
  const { runIssueTriageAction, runNextAction } = buildTransformReportActionRunners({
    setQuery: model.setQuery,
    openFirstCmdComparison,
    openPlaceholderFillTemplate: copyWorkflow.openPlaceholderFillTemplate,
    copyArchivePackage: copyWorkflow.copyArchivePackage,
    copyCollaborationReport: copyWorkflow.copyCollaborationReport,
    copyQualitySnapshot: copyWorkflow.copyQualitySnapshot,
  });
  const { footerActions, footerActionHandlers } = buildTransformReportPanelFooterModel({
    query: model.query,
    hasReportView: model.hasReportView,
    isFilterPending: model.isFilterPending,
    hasQualitySnapshot: Boolean(model.qualitySnapshot),
    qualityBaselineFilter: model.qualityBaseline?.filter ?? null,
    hasQualityBaselineDeltaText: Boolean(model.qualityBaselineDeltaText),
    hasPathValueCopyItems: model.hasPathValueCopyItems,
    hasCmdStructureCopyItems: model.hasCmdStructureCopyItems,
    hasFocusedCmdStructureCopyItems: model.hasFocusedCmdStructureCopyItems,
    hasIssueSampleCopyText: Boolean(model.issueSampleCopyText),
    hasIssueSampleJsonCopyText: Boolean(model.issueSampleJsonCopyText),
    hasRedactedIssueSampleJsonCopyText: Boolean(model.redactedIssueSampleJsonCopyText),
    hasIssueRegressionTemplateCopyText: Boolean(model.issueRegressionTemplateCopyText),
    hasActiveContext: Boolean(model.activeContext),
    copyTitles: model.copyTitles,
    copyWorkflow,
  });

  return (
    <TransformReportPanelFrame
      isOpen={isOpen}
      onClose={onClose}
      summary={formatTransformReportFooterSummary(model.report ? model.reportView : null)}
      actions={footerActions}
      actionHandlers={footerActionHandlers}
    >
      <TransformReportPanelContent
        report={model.report}
        reportView={model.reportView}
        query={model.query}
        issuePriorityCount={issuePriorityCount}
        isFilterPending={model.isFilterPending}
        hasTemplateFillTarget={Boolean(onOpenTemplateFill)}
        placeholderFillTemplateJsonText={model.placeholderFillTemplateJsonText}
        placeholderFillTemplateSummary={model.placeholderFillTemplateSummary}
        placeholderFillPanelTitle={placeholderFillPanelTitle}
        nextActions={nextActions}
        issueTriageItems={issueTriageItems}
        sectionVisibility={sectionVisibility}
        placeholderToolbarState={placeholderToolbarState}
        recordActions={recordActions}
        recordCmdComparison={recordCmdComparison}
        onFilter={model.setQuery}
        onOpenFirstCmdComparison={openFirstCmdComparison}
        onOpenPlaceholderFillTemplate={copyWorkflow.openPlaceholderFillTemplate}
        onCopyPlaceholderFillTemplate={copyWorkflow.copyPlaceholderFillTemplate}
        onCopyPlaceholderReport={copyWorkflow.copyPlaceholderReport}
        onRunNextAction={runNextAction}
        onRunIssueTriageAction={runIssueTriageAction}
      />
    </TransformReportPanelFrame>
  );
};
