import React, { useDeferredValue, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import type { TransformContext } from '../types';
import { copyText, getClipboardErrorMessage } from '../utils/clipboard';
import {
  buildTransformContextReport,
  buildTransformReportView,
  formatTransformCmdStructureReportText,
  formatTransformCmdStructureComparisonPackageText,
  formatTransformArchivePackageJsonText,
  formatTransformContextReportText,
  formatTransformCollaborationReportText,
  formatTransformDiagnosticSummaryText,
  formatTransformIssueRegressionTemplateText,
  formatTransformIssueSampleJsonText,
  formatTransformIssueSampleReportText,
  formatTransformPathValueReportText,
  formatTransformPlaceholderReportText,
  buildTransformQualitySnapshot,
  formatTransformQualitySnapshotDeltaText,
  formatTransformQualitySnapshotJsonText,
  formatTransformReportViewText,
  formatTransformTroubleshootingRecipeJsonText,
  buildTransformPlaceholderFillTemplate,
  getTransformPathValueCopyRows,
  getTransformRecordCmdStructureCopyText,
} from '../utils/transformSummary';
import type {
  TransformQualitySnapshot,
  TransformReportRecord,
} from '../utils/transformSummary';
import {
  formatCopySuccessMessage,
  formatPathValueCopyCountLabel,
  getPathValueCopyRowCount,
  isPathValueCopyLimited,
} from '../utils/transformReportCopyMetrics';
import { buildPlaceholderFillSummary } from '../utils/transformReportPlaceholderFillSummary';
import { buildTransformReportPlaceholderToolbarState } from '../utils/transformReportPlaceholderToolbarState';
import {
  buildCmdComparisonReportText,
  type CmdComparisonCandidateInput,
  type RankedCmdComparisonCandidate,
} from '../utils/transformReportCmdComparison';
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
  runTransformReportCopyText,
  type TransformReportCopyTextOptions,
} from '../utils/transformReportCopyActionRunner';
import {
  buildTransformReportFooterActionHandlers,
  buildTransformReportFooterActions,
} from '../utils/transformReportFooterActions';
import {
  buildTransformReportActionRunners,
  buildTransformReportIssueTriageItems,
  buildTransformReportNextActionItems,
} from '../utils/transformReportActionItems';
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
  const [qualityBaseline, setQualityBaseline] = useState<{
    snapshot: TransformQualitySnapshot;
    filter: string;
  } | null>(null);
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

  const copyPanelText = (options: TransformReportCopyTextOptions) => (
    runTransformReportCopyText(options, {
      copyText,
      showSuccess: (message, toastOptions) => toast.success(message, toastOptions),
      showError: showCopyError,
    })
  );

  const handleCopyReport = async () => {
    if (!activeContext) return;

    await copyPanelText({
      text: formatTransformContextReportText(activeContext),
      successMessage: text => formatCopySuccessMessage('解析报告', text),
      errorLogMessage: '复制深度解析报告失败:',
    });
  };

  const handleCopyFilteredReport = async () => {
    if (!report || !reportView || isFilterPending) return;

    await copyPanelText({
      text: formatTransformReportViewText(report, reportView, deferredQuery),
      successMessage: text => formatCopySuccessMessage('筛选结果', text),
      errorLogMessage: '复制深度解析筛选结果失败:',
    });
  };

  const handleCopyDiagnosticSummary = async () => {
    if (!report || !reportView || isFilterPending) return;

    await copyPanelText({
      text: formatTransformDiagnosticSummaryText(report, reportView, deferredQuery),
      successMessage: text => formatCopySuccessMessage('诊断摘要', text),
      errorLogMessage: '复制深度解析诊断摘要失败:',
    });
  };

  const handleCopyQualitySnapshot = async () => {
    if (!report || !reportView || isFilterPending) return;

    await copyPanelText({
      text: formatTransformQualitySnapshotJsonText(report, reportView, deferredQuery),
      successMessage: text => formatCopySuccessMessage('质量快照', text),
      errorLogMessage: '复制深度解析质量快照失败:',
    });
  };

  const handleSetQualityBaseline = () => {
    if (!qualitySnapshot || isFilterPending) return;

    setQualityBaseline({
      snapshot: qualitySnapshot,
      filter: deferredQuery.trim() || '全部',
    });
    toast.success('已设为临时质量基线', { duration: 1600 });
  };

  const handleCopyQualityBaselineDelta = async () => {
    if (!qualityBaselineDeltaText || isFilterPending) return;

    await copyPanelText({
      text: qualityBaselineDeltaText,
      successMessage: text => formatCopySuccessMessage('质量对比', text),
      errorLogMessage: '复制深度解析质量对比失败:',
    });
  };

  const handleClearQualityBaseline = () => {
    setQualityBaseline(null);
    toast.success('临时质量基线已清除', { duration: 1600 });
  };

  const handleCopyArchivePackage = async () => {
    if (!report || !reportView || isFilterPending) return;

    await copyPanelText({
      text: formatTransformArchivePackageJsonText(report, reportView, deferredQuery, {
        cmdComparisonReportText: buildActiveCmdComparisonReportText(),
        cmdComparisonCandidateText: buildActiveCmdComparisonCandidateText(),
      }),
      successMessage: text => formatCopySuccessMessage('归档包', text),
      errorLogMessage: '复制深度解析归档包失败:',
    });
  };

  const handleCopyTroubleshootingRecipe = async () => {
    if (!report || !reportView || isFilterPending) return;

    await copyPanelText({
      text: formatTransformTroubleshootingRecipeJsonText(report, reportView, deferredQuery),
      successMessage: text => formatCopySuccessMessage('排查 recipe', text),
      errorLogMessage: '复制深度解析排查 recipe 失败:',
    });
  };

  const handleCopyPathValueReport = async () => {
    if (!reportView || !hasPathValueCopyItems || isFilterPending) return;

    const pathValueCopyText = formatTransformPathValueReportText(reportView);
    await copyPanelText({
      text: pathValueCopyText,
      successMessage: `已复制路径和值（${formatPathValueCopyCountLabel(
        getPathValueCopyRowCount(reportView.records),
        isPathValueCopyLimited(reportView.records, reportView.isRecordTruncated)
      )}）`,
      errorLogMessage: '复制深度解析路径和值失败:',
    });
  };

  const handleCopyCmdStructureReport = async () => {
    if (!report || !reportView || !hasCmdStructureCopyItems || isFilterPending) return;

    await copyPanelText({
      text: formatTransformCmdStructureReportText(report, reportView, deferredQuery),
      successMessage: hasFocusedCmdStructureCopyItems ? '已复制聚焦 CMD 结构列表' : '已复制 CMD 结构列表',
      errorLogMessage: '复制深度解析 CMD 结构列表失败:',
    });
  };

  const handleCopyPlaceholderReport = async () => {
    if (!report || !reportView || isFilterPending) return;

    await copyPanelText({
      text: formatTransformPlaceholderReportText(report, reportView, deferredQuery),
      successMessage: deferredQuery.trim() ? '已复制筛选占位符' : '已复制占位符摘要',
      errorLogMessage: '复制深度解析占位符失败:',
    });
  };

  const handleCopyPlaceholderFillTemplate = async () => {
    if (!placeholderFillTemplateJsonText || isFilterPending) return;

    await copyPanelText({
      text: placeholderFillTemplateJsonText,
      successMessage: '已复制占位符回填模板',
      errorLogMessage: '复制深度解析占位符回填模板失败:',
    });
  };

  const handleOpenPlaceholderFillTemplate = () => {
    if (!placeholderFillTemplateJsonText || isFilterPending || !onOpenTemplateFill) return;

    onOpenTemplateFill(placeholderFillTemplateJsonText);
    toast.success('已填入模板填充', { duration: 1600 });
  };

  const handleCopyIssueSamples = async () => {
    if (!issueSampleCopyText || isFilterPending) return;

    await copyPanelText({
      text: issueSampleCopyText,
      successMessage: '已复制问题样本',
      errorLogMessage: '复制深度解析问题样本失败:',
    });
  };

  const handleCopyIssueSampleJson = async () => {
    if (!issueSampleJsonCopyText || isFilterPending) return;

    await copyPanelText({
      text: issueSampleJsonCopyText,
      successMessage: '已复制样本 JSON',
      errorLogMessage: '复制深度解析样本 JSON 失败:',
    });
  };

  const handleCopyRedactedIssueSampleJson = async () => {
    if (!redactedIssueSampleJsonCopyText || isFilterPending) return;

    await copyPanelText({
      text: redactedIssueSampleJsonCopyText,
      successMessage: '已复制脱敏样本 JSON',
      errorLogMessage: '复制深度解析脱敏样本 JSON 失败:',
    });
  };

  const handleCopyIssueRegressionTemplate = async () => {
    if (!issueRegressionTemplateCopyText || isFilterPending) return;

    await copyPanelText({
      text: issueRegressionTemplateCopyText,
      successMessage: '已复制回归模板',
      errorLogMessage: '复制深度解析回归模板失败:',
    });
  };

  const handleCopyPath = async (path: string, successMessage = '已复制路径') => {
    await copyPanelText({
      text: path,
      successMessage,
      errorLogMessage: '复制深度解析路径失败:',
      duration: 1600,
    });
  };

  const handleCopyOriginalValue = async (value: string, successMessage = '已复制原始值') => {
    await copyPanelText({
      text: value,
      successMessage,
      errorLogMessage: '复制深度解析原始值失败:',
      duration: 1600,
    });
  };

  const handleCopyDecodedPathValue = async (value: string) => {
    await copyPanelText({
      text: value,
      successMessage: '已复制路径和值',
      errorLogMessage: '复制深度解析内部路径和值失败:',
      duration: 1600,
    });
  };

  const handleCopyCmdStructure = async (record: TransformReportRecord) => {
    await copyPanelText({
      text: getTransformRecordCmdStructureCopyText(record),
      successMessage: record.cmdStructureFocusPaths?.length ? '已复制聚焦 CMD 结构' : '已复制 CMD 结构',
      errorLogMessage: '复制深度解析 CMD 结构失败:',
      duration: 1600,
    });
  };

  const handleCopyCmdComparisonPackage = async (record: TransformReportRecord) => {
    await copyPanelText({
      text: formatTransformCmdStructureComparisonPackageText(record),
      successMessage: '已复制 CMD 对比包',
      errorLogMessage: '复制深度解析 CMD 对比包失败:',
      duration: 1600,
    });
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

  const handleCopyCmdComparisonDiff = async (record: TransformReportRecord) => {
    await copyPanelText({
      text: buildCmdComparisonReportText(
        record,
        cmdComparisonState.expectedText,
        cmdComparisonState.ignoreExtraPaths,
        cmdComparisonState.actualCandidate
      ),
      successMessage: '已复制 CMD 差异报告',
      errorLogMessage: '复制 CMD 差异报告失败:',
      duration: 1600,
    });
  };

  const handleCopyCollaborationReport = async () => {
    if (!report || !reportView || isFilterPending) return;

    await copyPanelText({
      text: formatTransformCollaborationReportText(report, reportView, deferredQuery, {
        cmdComparisonReportText: buildActiveCmdComparisonReportText(),
        cmdComparisonCandidateText: buildActiveCmdComparisonCandidateText(),
      }),
      successMessage: text => formatCopySuccessMessage('排查报告', text),
      errorLogMessage: '复制协作排查报告失败:',
    });
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
    openPlaceholderFillTemplate: handleOpenPlaceholderFillTemplate,
    copyArchivePackage: handleCopyArchivePackage,
    copyCollaborationReport: handleCopyCollaborationReport,
    copyQualitySnapshot: handleCopyQualitySnapshot,
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
    copyFilteredReport: handleCopyFilteredReport,
    copyCollaborationReport: handleCopyCollaborationReport,
    copyDiagnosticSummary: handleCopyDiagnosticSummary,
    copyQualitySnapshot: handleCopyQualitySnapshot,
    setQualityBaseline: handleSetQualityBaseline,
    copyQualityBaselineDelta: handleCopyQualityBaselineDelta,
    clearQualityBaseline: handleClearQualityBaseline,
    copyArchivePackage: handleCopyArchivePackage,
    copyTroubleshootingRecipe: handleCopyTroubleshootingRecipe,
    copyPathValueReport: handleCopyPathValueReport,
    copyCmdStructureReport: handleCopyCmdStructureReport,
    copyIssueSamples: handleCopyIssueSamples,
    copyIssueSampleJson: handleCopyIssueSampleJson,
    copyRedactedIssueSampleJson: handleCopyRedactedIssueSampleJson,
    copyIssueRegressionTemplate: handleCopyIssueRegressionTemplate,
    copyFullReport: handleCopyReport,
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
        onOpenPlaceholderFillTemplate={handleOpenPlaceholderFillTemplate}
        onCopyPlaceholderFillTemplate={handleCopyPlaceholderFillTemplate}
        onCopyPlaceholderReport={handleCopyPlaceholderReport}
        onRunNextAction={runNextAction}
        onRunIssueTriageAction={runIssueTriageAction}
        onCopyPath={handleCopyPath}
        onCopyOriginalValue={handleCopyOriginalValue}
        onCopyDecodedPathValue={handleCopyDecodedPathValue}
        onCopyCmdStructure={handleCopyCmdStructure}
        onCopyCmdComparisonPackage={handleCopyCmdComparisonPackage}
        onToggleCmdComparison={handleToggleCmdComparison}
        onCopyCmdComparisonDiff={handleCopyCmdComparisonDiff}
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
