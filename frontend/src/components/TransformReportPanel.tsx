import React, { useDeferredValue, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import type { TransformContext } from '../types';
import { copyText, getClipboardErrorMessage } from '../utils/clipboard';
import {
  buildTransformContextReport,
  buildTransformReportView,
} from '../utils/transformSummary';
import {
  createInitialTransformReportCmdComparisonState,
  resetTransformReportCmdComparisonState,
} from '../utils/transformReportCmdComparisonController';
import { formatTransformReportFooterSummary } from '../utils/transformReportFooterSummary';
import {
  buildTransformReportActionRunners,
} from '../utils/transformReportActionItems';
import type { TransformReportQualityBaseline } from '../utils/transformReportPanelCopyWorkflow';
import { buildTransformReportPanelCopyWorkflowModel } from '../utils/transformReportPanelCopyWorkflowModel';
import { buildTransformReportPanelSectionModel } from '../utils/transformReportPanelSectionModel';
import { buildTransformReportPanelDerivedModel } from '../utils/transformReportPanelDerivedModel';
import { buildTransformReportPanelFooterModel } from '../utils/transformReportPanelFooterModel';
import { TransformReportPanelContent } from './TransformReportPanelContent';
import { TransformReportPanelFrame } from './TransformReportPanelFrame';
import { buildTransformReportRecordSectionBindings } from './transformReportRecordSectionBindings';

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
  const [query, setQuery] = useState('');
  const [cmdComparisonState, setCmdComparisonState] = useState(createInitialTransformReportCmdComparisonState);
  const [qualityBaseline, setQualityBaseline] = useState<TransformReportQualityBaseline | null>(null);
  const deferredQuery = useDeferredValue(query);
  const isFilterPending = query !== deferredQuery;
  const activeContext = isOpen ? context : null;
  const report = useMemo(() => (
    activeContext ? buildTransformContextReport(activeContext) : null
  ), [activeContext]);
  const reportContextTimestamp = activeContext?.timestamp ?? 0;

  useEffect(() => {
    setQuery('');
    setCmdComparisonState(resetTransformReportCmdComparisonState());
  }, [reportContextTimestamp]);

  const reportView = useMemo(() => (
    report ? buildTransformReportView(report, deferredQuery) : null
  ), [report, deferredQuery]);
  const fullReportView = useMemo(() => (
    report ? buildTransformReportView(report, '') : null
  ), [report]);
  const {
    hasReportView,
    hasPathValueCopyItems,
    hasCmdStructureCopyItems,
    hasFocusedCmdStructureCopyItems,
    issueSampleCopyText,
    issueSampleJsonCopyText,
    redactedIssueSampleJsonCopyText,
    issueRegressionTemplateCopyText,
    placeholderFillTemplateSummary,
    placeholderFillTemplateJsonText,
    qualitySnapshot,
    qualityBaselineDeltaText,
    copyTitles,
    getPanelPlaceholderFillTemplateTitle,
  } = useMemo(() => (
    buildTransformReportPanelDerivedModel({
      report,
      reportView,
      fullReportView,
      deferredQuery,
      isFilterPending,
      qualityBaseline,
      hasActiveContext: Boolean(activeContext),
    })
  ), [
    activeContext,
    deferredQuery,
    fullReportView,
    isFilterPending,
    qualityBaseline,
    report,
    reportView,
  ]);
  const showCopyError = (message: string, error: unknown) => {
    console.warn(message, error);
    toast.error(getClipboardErrorMessage(error), { duration: 2000 });
  };

  const {
    copyWorkflow,
    getCmdComparisonCandidateRecords,
  } = buildTransformReportPanelCopyWorkflowModel({
    copyWorkflowState: {
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
    },
    cmdComparisonState,
    fullReportView,
    effects: {
      copyText,
      showSuccess: (message, toastOptions) => toast.success(message, toastOptions),
      showError: showCopyError,
      setQualityBaseline,
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
    cmdComparisonState,
    setCmdComparisonState,
    setQuery,
    firstCmdStructureRecord: reportView?.cmdStructureRecords[0],
    getCandidateRecords: getCmdComparisonCandidateRecords,
    onLocatePath,
    onOpenSchemeValue,
  });

  const sectionModel = buildTransformReportPanelSectionModel({
    report,
    reportView,
    isFilterPending,
    hasTemplateFillTarget: Boolean(onOpenTemplateFill),
    hasPlaceholderFillTemplate: Boolean(placeholderFillTemplateJsonText),
    formatPlaceholderFillTitle: getPanelPlaceholderFillTemplateTitle,
    archivePackageTitle: copyTitles.archivePackage,
    collaborationReportTitle: copyTitles.collaborationReport,
    qualitySnapshotTitle: copyTitles.qualitySnapshot,
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
    setQuery,
    openFirstCmdComparison,
    openPlaceholderFillTemplate: copyWorkflow.openPlaceholderFillTemplate,
    copyArchivePackage: copyWorkflow.copyArchivePackage,
    copyCollaborationReport: copyWorkflow.copyCollaborationReport,
    copyQualitySnapshot: copyWorkflow.copyQualitySnapshot,
  });
  const { footerActions, footerActionHandlers } = buildTransformReportPanelFooterModel({
    query,
    hasReportView,
    isFilterPending,
    hasQualitySnapshot: Boolean(qualitySnapshot),
    qualityBaselineFilter: qualityBaseline?.filter ?? null,
    hasQualityBaselineDeltaText: Boolean(qualityBaselineDeltaText),
    hasPathValueCopyItems,
    hasCmdStructureCopyItems,
    hasFocusedCmdStructureCopyItems,
    hasIssueSampleCopyText: Boolean(issueSampleCopyText),
    hasIssueSampleJsonCopyText: Boolean(issueSampleJsonCopyText),
    hasRedactedIssueSampleJsonCopyText: Boolean(redactedIssueSampleJsonCopyText),
    hasIssueRegressionTemplateCopyText: Boolean(issueRegressionTemplateCopyText),
    hasActiveContext: Boolean(activeContext),
    copyTitles,
    copyWorkflow,
  });

  return (
    <TransformReportPanelFrame
      isOpen={isOpen}
      onClose={onClose}
      summary={formatTransformReportFooterSummary(report ? reportView : null)}
      actions={footerActions}
      actionHandlers={footerActionHandlers}
    >
      <TransformReportPanelContent
        report={report}
        reportView={reportView}
        query={query}
        issuePriorityCount={issuePriorityCount}
        isFilterPending={isFilterPending}
        hasTemplateFillTarget={Boolean(onOpenTemplateFill)}
        placeholderFillTemplateJsonText={placeholderFillTemplateJsonText}
        placeholderFillTemplateSummary={placeholderFillTemplateSummary}
        placeholderFillPanelTitle={placeholderFillPanelTitle}
        nextActions={nextActions}
        issueTriageItems={issueTriageItems}
        sectionVisibility={sectionVisibility}
        placeholderToolbarState={placeholderToolbarState}
        recordActions={recordActions}
        recordCmdComparison={recordCmdComparison}
        onFilter={setQuery}
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
