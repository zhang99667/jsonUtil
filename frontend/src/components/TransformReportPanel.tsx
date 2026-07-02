import React, { useDeferredValue, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import type { TransformContext } from '../types';
import { copyText, getClipboardErrorMessage } from '../utils/clipboard';
import {
  buildTransformContextReport,
  buildTransformReportView,
  buildTransformQualitySnapshot,
  formatTransformIssueRegressionTemplateText,
  formatTransformIssueSampleJsonText,
  formatTransformIssueSampleReportText,
  formatTransformQualitySnapshotDeltaText,
  buildTransformPlaceholderFillTemplate,
  getTransformPathValueCopyRows,
} from '../utils/transformSummary';
import { buildPlaceholderFillSummary } from '../utils/transformReportPlaceholderFillSummary';
import {
  createInitialTransformReportCmdComparisonState,
  resetTransformReportCmdComparisonState,
} from '../utils/transformReportCmdComparisonController';
import {
  buildActiveCmdComparisonCandidateText as buildActiveCmdComparisonCandidateTextForPanel,
  buildActiveCmdComparisonReportText as buildActiveCmdComparisonReportTextForPanel,
  getCmdComparisonCandidateRecords as getCmdComparisonCandidateRecordsForPanel,
} from '../utils/transformReportActiveCmdComparison';
import { formatTransformReportFooterSummary } from '../utils/transformReportFooterSummary';
import {
  buildTransformReportCopyTitles,
  getTransformPlaceholderFillTemplateTitle,
} from '../utils/transformReportCopyTitles';
import { buildTransformReportSectionVisibility } from '../utils/transformReportSectionVisibility';
import {
  buildTransformReportFooterActionHandlers,
  buildTransformReportFooterActions,
} from '../utils/transformReportFooterActions';
import {
  buildTransformReportActionRunners,
} from '../utils/transformReportActionItems';
import {
  buildTransformReportPanelCopyWorkflow,
  type TransformReportQualityBaseline,
} from '../utils/transformReportPanelCopyWorkflow';
import { buildTransformReportPanelSectionModel } from '../utils/transformReportPanelSectionModel';
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
  const hasPathValueCopyItems = useMemo(() => (
    Boolean(reportView?.records.some(record => (
      getTransformPathValueCopyRows(record).length > 0
    )))
  ), [reportView]);
  const hasCmdStructureCopyItems = useMemo(() => (
    Boolean(reportView && reportView.filteredCmdStructureCount > 0)
  ), [reportView]);
  const hasFocusedCmdStructureCopyItems = useMemo(() => (
    Boolean(reportView?.cmdStructureRecords.some(record => record.cmdStructureFocusPaths?.length))
  ), [reportView]);
  const issueSampleCopyText = useMemo(() => (
    reportView ? formatTransformIssueSampleReportText(reportView, deferredQuery) : ''
  ), [deferredQuery, reportView]);
  const issueSampleJsonCopyText = useMemo(() => (
    reportView ? formatTransformIssueSampleJsonText(reportView, { filter: deferredQuery }) : ''
  ), [deferredQuery, reportView]);
  const redactedIssueSampleJsonCopyText = useMemo(() => (
    reportView ? formatTransformIssueSampleJsonText(reportView, {
      redactSensitiveValues: true,
      filter: deferredQuery,
    }) : ''
  ), [deferredQuery, reportView]);
  const issueRegressionTemplateCopyText = useMemo(() => (
    reportView ? formatTransformIssueRegressionTemplateText(reportView, {
      redactSensitiveValues: true,
      filter: deferredQuery,
    }) : ''
  ), [deferredQuery, reportView]);
  const placeholderFillTemplate = useMemo(() => (
    reportView
      ? buildTransformPlaceholderFillTemplate(reportView, deferredQuery, fullReportView || reportView)
      : null
  ), [deferredQuery, fullReportView, reportView]);
  const placeholderFillTemplateSummary = useMemo(() => (
    buildPlaceholderFillSummary(placeholderFillTemplate)
  ), [placeholderFillTemplate]);
  const placeholderFillTemplateJsonText = useMemo(() => (
    placeholderFillTemplate ? JSON.stringify(placeholderFillTemplate, null, 2) : ''
  ), [placeholderFillTemplate]);
  const qualitySnapshot = useMemo(() => (
    report && reportView ? buildTransformQualitySnapshot(report, reportView, deferredQuery) : null
  ), [deferredQuery, report, reportView]);
  const qualityBaselineDeltaText = useMemo(() => (
    qualityBaseline && qualitySnapshot
      ? formatTransformQualitySnapshotDeltaText(qualityBaseline.snapshot, qualitySnapshot)
      : ''
  ), [qualityBaseline, qualitySnapshot]);
  const hasReportView = Boolean(reportView);
  const copyTitles = buildTransformReportCopyTitles({
    hasReportView,
    isFilterPending,
    hasFilteredReport: Boolean(reportView),
    hasQualityBaselineDeltaText: Boolean(qualityBaselineDeltaText),
    hasPathValueCopyItems,
    hasCmdStructureCopyItems,
    hasFocusedCmdStructureCopyItems,
    hasIssueSampleCopyText: Boolean(issueSampleCopyText),
    hasIssueSampleJsonCopyText: Boolean(issueSampleJsonCopyText),
    hasRedactedIssueSampleJsonCopyText: Boolean(redactedIssueSampleJsonCopyText),
    hasIssueRegressionTemplateCopyText: Boolean(issueRegressionTemplateCopyText),
    hasActiveContext: Boolean(activeContext),
  });
  const getPanelPlaceholderFillTemplateTitle = (readyTitle: string): string => (
    getTransformPlaceholderFillTemplateTitle(
      readyTitle,
      Boolean(placeholderFillTemplateJsonText),
      placeholderFillTemplateSummary,
      isFilterPending
    )
  );
  const showCopyError = (message: string, error: unknown) => {
    console.warn(message, error);
    toast.error(getClipboardErrorMessage(error), { duration: 2000 });
  };

  const activeCmdComparisonState = {
    ...cmdComparisonState,
    report,
    reportView,
    fullReportView,
  };

  const buildActiveCmdComparisonReportText = (): string => {
    return buildActiveCmdComparisonReportTextForPanel(activeCmdComparisonState);
  };

  const buildActiveCmdComparisonCandidateText = (): string => {
    return buildActiveCmdComparisonCandidateTextForPanel(activeCmdComparisonState);
  };

  const copyWorkflow = buildTransformReportPanelCopyWorkflow({
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
  }, {
    copyText,
    showSuccess: (message, toastOptions) => toast.success(message, toastOptions),
    showError: showCopyError,
    setQualityBaseline,
    showStatusSuccess: (message, toastOptions) => toast.success(message, toastOptions),
    openTemplateFill: onOpenTemplateFill,
    buildActiveCmdComparisonReportText,
    buildActiveCmdComparisonCandidateText,
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
    getCandidateRecords: () => getCmdComparisonCandidateRecordsForPanel(activeCmdComparisonState),
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
  const footerActions = buildTransformReportFooterActions({
    hasQuery: Boolean(query.trim()),
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
  });
  const footerActionHandlers = buildTransformReportFooterActionHandlers({
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
