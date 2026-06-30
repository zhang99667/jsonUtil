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
import type { TransformReportRecord } from '../utils/transformSummary';
import { buildPlaceholderFillSummary } from '../utils/transformReportPlaceholderFillSummary';
import { buildTransformReportPlaceholderToolbarState } from '../utils/transformReportPlaceholderToolbarState';
import type { RankedCmdComparisonCandidate } from '../utils/transformReportCmdComparison';
import {
  buildOpenFirstTransformReportCmdComparisonPlan,
  createInitialTransformReportCmdComparisonState,
  resetTransformReportCmdComparisonState,
  switchTransformReportCmdComparisonCandidate,
  toggleTransformReportCmdComparisonRecord,
  updateTransformReportCmdComparisonExpectedText,
  updateTransformReportCmdComparisonIgnoreExtraPaths,
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
  buildTransformReportIssueTriageItems,
  buildTransformReportNextActionItems,
} from '../utils/transformReportActionItems';
import {
  buildTransformReportPanelCopyWorkflow,
  type TransformReportQualityBaseline,
} from '../utils/transformReportPanelCopyWorkflow';
import { TransformReportPanelContent } from './TransformReportPanelContent';
import { TransformReportPanelFooter } from './TransformReportPanelFooter';
import { DraggablePanel, PanelIcons } from './DraggablePanel';

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
  const issuePriorityCount = report
    ? report.summary.unresolvedCount + report.summary.warningCount + report.summary.placeholderCount
    : 0;

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

  const handleToggleCmdComparison = (record: TransformReportRecord) => {
    setCmdComparisonState(currentState => toggleTransformReportCmdComparisonRecord(currentState, record));
  };

  const handleOpenFirstCmdComparison = () => {
    const plan = buildOpenFirstTransformReportCmdComparisonPlan(
      cmdComparisonState,
      reportView?.cmdStructureRecords[0]
    );
    if (!plan) return;

    setQuery(plan.query);
    setCmdComparisonState(plan.state);
  };

  const handleSwitchCmdComparisonCandidate = (candidate: RankedCmdComparisonCandidate) => {
    const plan = switchTransformReportCmdComparisonCandidate(cmdComparisonState, candidate);
    setQuery(plan.query);
    setCmdComparisonState(plan.state);
  };

  const handleLocatePath = (path: string) => {
    if (!onLocatePath) return;

    onLocatePath(path);
    toast.success('已填入 JSONPath 查询', { duration: 1600 });
  };

  const handleOpenSchemeValue = (value: string) => {
    if (!onOpenSchemeValue) return;

    onOpenSchemeValue(value);
    toast.success('已填入 Scheme 解析', { duration: 1600 });
  };

  const placeholderFillPanelTitle = getPanelPlaceholderFillTemplateTitle('把运行时占位符回填模板填入模板填充面板');
  const canOpenPlaceholderFill = Boolean(onOpenTemplateFill && placeholderFillTemplateJsonText && !isFilterPending);
  const placeholderToolbarState = reportView
    ? buildTransformReportPlaceholderToolbarState({
      filteredPlaceholderCount: reportView.filteredPlaceholderCount,
      isPlaceholderTruncated: reportView.isPlaceholderTruncated,
      hasTemplateFillTarget: Boolean(onOpenTemplateFill),
      hasPlaceholderFillTemplate: Boolean(placeholderFillTemplateJsonText),
      isFilterPending,
      formatTemplateFillTitle: getPanelPlaceholderFillTemplateTitle,
    })
    : null;
  const sectionVisibility = buildTransformReportSectionVisibility(reportView);
  const issueTriageItems = report ? buildTransformReportIssueTriageItems({
    warningCount: report.summary.warningCount,
    unresolvedCount: report.summary.unresolvedCount,
    placeholderCount: report.summary.placeholderCount,
    canOpenPlaceholderFill,
    placeholderFillTitle: placeholderFillPanelTitle,
  }) : [];
  const { runIssueTriageAction, runNextAction } = buildTransformReportActionRunners({
    setQuery,
    openFirstCmdComparison: handleOpenFirstCmdComparison,
    openPlaceholderFillTemplate: copyWorkflow.openPlaceholderFillTemplate,
    copyArchivePackage: copyWorkflow.copyArchivePackage,
    copyCollaborationReport: copyWorkflow.copyCollaborationReport,
    copyQualitySnapshot: copyWorkflow.copyQualitySnapshot,
  });
  const nextActions = buildTransformReportNextActionItems({
    hasReport: Boolean(report),
    hasReportView: Boolean(reportView),
    hasFilteredCmdStructure: Boolean(reportView?.filteredCmdStructureCount),
    hasPlaceholders: Boolean(report?.summary.placeholderCount),
    issuePriorityCount,
    canOpenPlaceholderFill,
    isFilterPending,
    placeholderFillTitle: placeholderFillPanelTitle,
    archivePackageTitle: copyTitles.archivePackage,
    collaborationReportTitle: copyTitles.collaborationReport,
    qualitySnapshotTitle: copyTitles.qualitySnapshot,
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

  const footer = (
    <TransformReportPanelFooter
      summary={formatTransformReportFooterSummary(report ? reportView : null)}
      actions={footerActions}
      actionHandlers={footerActionHandlers}
    />
  );

  return (
    <DraggablePanel
      isOpen={isOpen}
      onClose={onClose}
      title="深度解析报告"
      icon={PanelIcons.Code}
      storageKey="transform-report-panel"
      defaultPosition={{ x: 220, y: 120 }}
      defaultSize={{ width: 680, height: 520 }}
      minSize={{ width: 480, height: 320 }}
      footer={footer}
      dataTour="transform-report-panel"
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
        cmdComparisonRecordPath={cmdComparisonState.recordPath}
        cmdComparisonActualCandidate={cmdComparisonState.actualCandidate}
        cmdComparisonExpectedText={cmdComparisonState.expectedText}
        cmdComparisonIgnoreExtraPaths={cmdComparisonState.ignoreExtraPaths}
        getCmdComparisonCandidateRecords={() => getCmdComparisonCandidateRecordsForPanel(activeCmdComparisonState)}
        onFilter={setQuery}
        onOpenFirstCmdComparison={handleOpenFirstCmdComparison}
        onOpenPlaceholderFillTemplate={copyWorkflow.openPlaceholderFillTemplate}
        onCopyPlaceholderFillTemplate={copyWorkflow.copyPlaceholderFillTemplate}
        onCopyPlaceholderReport={copyWorkflow.copyPlaceholderReport}
        onRunNextAction={runNextAction}
        onRunIssueTriageAction={runIssueTriageAction}
        onCopyPath={copyWorkflow.copyPath}
        onCopyOriginalValue={copyWorkflow.copyOriginalValue}
        onCopyDecodedPathValue={copyWorkflow.copyDecodedPathValue}
        onCopyCmdStructure={copyWorkflow.copyCmdStructure}
        onCopyCmdComparisonPackage={copyWorkflow.copyCmdComparisonPackage}
        onToggleCmdComparison={handleToggleCmdComparison}
        onCopyCmdComparisonDiff={copyWorkflow.copyCmdComparisonDiff}
        onSwitchCmdComparisonCandidate={handleSwitchCmdComparisonCandidate}
        onCmdComparisonExpectedTextChange={expectedText => setCmdComparisonState(currentState => (
          updateTransformReportCmdComparisonExpectedText(currentState, expectedText)
        ))}
        onCmdComparisonIgnoreExtraPathsChange={ignoreExtraPaths => setCmdComparisonState(currentState => (
          updateTransformReportCmdComparisonIgnoreExtraPaths(currentState, ignoreExtraPaths)
        ))}
        onLocatePath={onLocatePath ? handleLocatePath : undefined}
        onOpenSchemeValue={onOpenSchemeValue ? handleOpenSchemeValue : undefined}
      />
    </DraggablePanel>
  );
};
