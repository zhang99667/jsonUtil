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
import {
  buildCmdComparisonReportText,
  toCmdComparisonCandidateInput,
  type CmdComparisonCandidateInput,
  type RankedCmdComparisonCandidate,
} from '../utils/transformReportCmdComparison';
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
import {
  buildTransformReportFooterActionHandlers,
  buildTransformReportFooterActions,
} from '../utils/transformReportFooterActions';
import {
  buildTransformReportActionRunners,
  buildTransformReportIssueTriageItems,
  buildTransformReportNextActionItems,
} from '../utils/transformReportActionItems';
import { TransformReportEmptyState } from './TransformReportEmptyState';
import { TransformReportFilterBar } from './TransformReportFilterBar';
import { TransformReportPanelFooter } from './TransformReportPanelFooter';
import { TransformReportPlaceholdersSection } from './TransformReportPlaceholdersSection';
import { TransformReportRecordsSection } from './TransformReportRecordsSection';
import { TransformReportSummarySection } from './TransformReportSummarySection';
import { TransformReportUnresolvedSection } from './TransformReportUnresolvedSection';
import { TransformReportWarningsSection } from './TransformReportWarningsSection';
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
  const [cmdComparisonRecordPath, setCmdComparisonRecordPath] = useState<string | null>(null);
  const [cmdComparisonActualCandidate, setCmdComparisonActualCandidate] = useState<CmdComparisonCandidateInput | null>(null);
  const [cmdComparisonExpectedText, setCmdComparisonExpectedText] = useState('');
  const [cmdComparisonIgnoreExtraPaths, setCmdComparisonIgnoreExtraPaths] = useState(false);
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
    setCmdComparisonRecordPath(null);
    setCmdComparisonActualCandidate(null);
    setCmdComparisonExpectedText('');
    setCmdComparisonIgnoreExtraPaths(false);
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

  const handleCopyReport = async () => {
    if (!activeContext) return;

    try {
      const reportText = formatTransformContextReportText(activeContext);
      await copyText(reportText);
      toast.success(formatCopySuccessMessage('解析报告', reportText), { duration: 2000 });
    } catch (error) {
      showCopyError('复制深度解析报告失败:', error);
    }
  };

  const handleCopyFilteredReport = async () => {
    if (!report || !reportView || isFilterPending) return;

    try {
      const filteredReportText = formatTransformReportViewText(report, reportView, deferredQuery);
      await copyText(filteredReportText);
      toast.success(formatCopySuccessMessage('筛选结果', filteredReportText), { duration: 2000 });
    } catch (error) {
      showCopyError('复制深度解析筛选结果失败:', error);
    }
  };

  const handleCopyDiagnosticSummary = async () => {
    if (!report || !reportView || isFilterPending) return;

    try {
      const diagnosticSummaryText = formatTransformDiagnosticSummaryText(report, reportView, deferredQuery);
      await copyText(diagnosticSummaryText);
      toast.success(formatCopySuccessMessage('诊断摘要', diagnosticSummaryText), { duration: 2000 });
    } catch (error) {
      showCopyError('复制深度解析诊断摘要失败:', error);
    }
  };

  const handleCopyQualitySnapshot = async () => {
    if (!report || !reportView || isFilterPending) return;

    try {
      const qualitySnapshotText = formatTransformQualitySnapshotJsonText(report, reportView, deferredQuery);
      await copyText(qualitySnapshotText);
      toast.success(formatCopySuccessMessage('质量快照', qualitySnapshotText), { duration: 2000 });
    } catch (error) {
      showCopyError('复制深度解析质量快照失败:', error);
    }
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

    try {
      await copyText(qualityBaselineDeltaText);
      toast.success(formatCopySuccessMessage('质量对比', qualityBaselineDeltaText), { duration: 2000 });
    } catch (error) {
      showCopyError('复制深度解析质量对比失败:', error);
    }
  };

  const handleClearQualityBaseline = () => {
    setQualityBaseline(null);
    toast.success('临时质量基线已清除', { duration: 1600 });
  };

  const handleCopyArchivePackage = async () => {
    if (!report || !reportView || isFilterPending) return;

    try {
      const archivePackageText = formatTransformArchivePackageJsonText(report, reportView, deferredQuery, {
        cmdComparisonReportText: buildActiveCmdComparisonReportText(),
        cmdComparisonCandidateText: buildActiveCmdComparisonCandidateText(),
      });
      await copyText(archivePackageText);
      toast.success(formatCopySuccessMessage('归档包', archivePackageText), { duration: 2000 });
    } catch (error) {
      showCopyError('复制深度解析归档包失败:', error);
    }
  };

  const handleCopyTroubleshootingRecipe = async () => {
    if (!report || !reportView || isFilterPending) return;

    try {
      const recipeText = formatTransformTroubleshootingRecipeJsonText(report, reportView, deferredQuery);
      await copyText(recipeText);
      toast.success(formatCopySuccessMessage('排查 recipe', recipeText), { duration: 2000 });
    } catch (error) {
      showCopyError('复制深度解析排查 recipe 失败:', error);
    }
  };

  const handleCopyPathValueReport = async () => {
    if (!reportView || !hasPathValueCopyItems || isFilterPending) return;

    try {
      const pathValueCopyText = formatTransformPathValueReportText(reportView);
      if (!pathValueCopyText) return;

      await copyText(pathValueCopyText);
      toast.success(`已复制路径和值（${formatPathValueCopyCountLabel(
        getPathValueCopyRowCount(reportView.records),
        isPathValueCopyLimited(reportView.records, reportView.isRecordTruncated)
      )}）`, { duration: 2000 });
    } catch (error) {
      showCopyError('复制深度解析路径和值失败:', error);
    }
  };

  const handleCopyCmdStructureReport = async () => {
    if (!report || !reportView || !hasCmdStructureCopyItems || isFilterPending) return;

    try {
      const cmdStructureCopyText = formatTransformCmdStructureReportText(report, reportView, deferredQuery);
      if (!cmdStructureCopyText) return;

      await copyText(cmdStructureCopyText);
      toast.success(hasFocusedCmdStructureCopyItems ? '已复制聚焦 CMD 结构列表' : '已复制 CMD 结构列表', { duration: 2000 });
    } catch (error) {
      showCopyError('复制深度解析 CMD 结构列表失败:', error);
    }
  };

  const handleCopyPlaceholderReport = async () => {
    if (!report || !reportView || isFilterPending) return;

    try {
      await copyText(formatTransformPlaceholderReportText(report, reportView, deferredQuery));
      toast.success(deferredQuery.trim() ? '已复制筛选占位符' : '已复制占位符摘要', { duration: 2000 });
    } catch (error) {
      showCopyError('复制深度解析占位符失败:', error);
    }
  };

  const handleCopyPlaceholderFillTemplate = async () => {
    if (!placeholderFillTemplateJsonText || isFilterPending) return;

    try {
      await copyText(placeholderFillTemplateJsonText);
      toast.success('已复制占位符回填模板', { duration: 2000 });
    } catch (error) {
      showCopyError('复制深度解析占位符回填模板失败:', error);
    }
  };

  const handleOpenPlaceholderFillTemplate = () => {
    if (!placeholderFillTemplateJsonText || isFilterPending || !onOpenTemplateFill) return;

    onOpenTemplateFill(placeholderFillTemplateJsonText);
    toast.success('已填入模板填充', { duration: 1600 });
  };

  const handleCopyIssueSamples = async () => {
    if (!issueSampleCopyText || isFilterPending) return;

    try {
      await copyText(issueSampleCopyText);
      toast.success('已复制问题样本', { duration: 2000 });
    } catch (error) {
      showCopyError('复制深度解析问题样本失败:', error);
    }
  };

  const handleCopyIssueSampleJson = async () => {
    if (!issueSampleJsonCopyText || isFilterPending) return;

    try {
      await copyText(issueSampleJsonCopyText);
      toast.success('已复制样本 JSON', { duration: 2000 });
    } catch (error) {
      showCopyError('复制深度解析样本 JSON 失败:', error);
    }
  };

  const handleCopyRedactedIssueSampleJson = async () => {
    if (!redactedIssueSampleJsonCopyText || isFilterPending) return;

    try {
      await copyText(redactedIssueSampleJsonCopyText);
      toast.success('已复制脱敏样本 JSON', { duration: 2000 });
    } catch (error) {
      showCopyError('复制深度解析脱敏样本 JSON 失败:', error);
    }
  };

  const handleCopyIssueRegressionTemplate = async () => {
    if (!issueRegressionTemplateCopyText || isFilterPending) return;

    try {
      await copyText(issueRegressionTemplateCopyText);
      toast.success('已复制回归模板', { duration: 2000 });
    } catch (error) {
      showCopyError('复制深度解析回归模板失败:', error);
    }
  };

  const handleCopyPath = async (path: string, successMessage = '已复制路径') => {
    try {
      await copyText(path);
      toast.success(successMessage, { duration: 1600 });
    } catch (error) {
      showCopyError('复制深度解析路径失败:', error);
    }
  };

  const handleCopyOriginalValue = async (value: string, successMessage = '已复制原始值') => {
    try {
      await copyText(value);
      toast.success(successMessage, { duration: 1600 });
    } catch (error) {
      showCopyError('复制深度解析原始值失败:', error);
    }
  };

  const handleCopyDecodedPathValue = async (value: string) => {
    try {
      await copyText(value);
      toast.success('已复制路径和值', { duration: 1600 });
    } catch (error) {
      showCopyError('复制深度解析内部路径和值失败:', error);
    }
  };

  const handleCopyCmdStructure = async (record: TransformReportRecord) => {
    try {
      const cmdStructureCopyText = getTransformRecordCmdStructureCopyText(record);
      if (!cmdStructureCopyText) return;

      await copyText(cmdStructureCopyText);
      toast.success(record.cmdStructureFocusPaths?.length ? '已复制聚焦 CMD 结构' : '已复制 CMD 结构', { duration: 1600 });
    } catch (error) {
      showCopyError('复制深度解析 CMD 结构失败:', error);
    }
  };

  const handleCopyCmdComparisonPackage = async (record: TransformReportRecord) => {
    try {
      const comparisonPackageText = formatTransformCmdStructureComparisonPackageText(record);
      if (!comparisonPackageText) return;

      await copyText(comparisonPackageText);
      toast.success('已复制 CMD 对比包', { duration: 1600 });
    } catch (error) {
      showCopyError('复制深度解析 CMD 对比包失败:', error);
    }
  };

  const activeCmdComparisonState = {
    recordPath: cmdComparisonRecordPath,
    expectedText: cmdComparisonExpectedText,
    ignoreExtraPaths: cmdComparisonIgnoreExtraPaths,
    actualCandidate: cmdComparisonActualCandidate,
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
    setCmdComparisonRecordPath(currentPath => {
      if (currentPath === record.path) {
        setCmdComparisonActualCandidate(null);
        setCmdComparisonExpectedText('');
        return null;
      }

      setCmdComparisonActualCandidate(null);
      setCmdComparisonExpectedText('');
      return record.path;
    });
  };

  const handleOpenFirstCmdComparison = () => {
    const firstRecord = reportView?.cmdStructureRecords[0];
    if (!firstRecord) return;

    setQuery('CMD结构');
    setCmdComparisonExpectedText('');
    setCmdComparisonActualCandidate(null);
    setCmdComparisonRecordPath(firstRecord.path);
  };

  const handleSwitchCmdComparisonCandidate = (candidate: RankedCmdComparisonCandidate) => {
    setQuery(candidate.recordPath);
    setCmdComparisonRecordPath(candidate.recordPath);
    setCmdComparisonActualCandidate(
      candidate.id === candidate.recordPath
        ? null
        : toCmdComparisonCandidateInput(candidate)
    );
  };

  const handleCopyCmdComparisonDiff = async (record: TransformReportRecord) => {
    try {
      const reportText = buildCmdComparisonReportText(
        record,
        cmdComparisonExpectedText,
        cmdComparisonIgnoreExtraPaths,
        cmdComparisonActualCandidate
      );
      if (!reportText) return;

      await copyText(reportText);
      toast.success('已复制 CMD 差异报告', { duration: 1600 });
    } catch (error) {
      showCopyError('复制 CMD 差异报告失败:', error);
    }
  };

  const handleCopyCollaborationReport = async () => {
    if (!report || !reportView || isFilterPending) return;

    try {
      const collaborationReportText = formatTransformCollaborationReportText(report, reportView, deferredQuery, {
        cmdComparisonReportText: buildActiveCmdComparisonReportText(),
        cmdComparisonCandidateText: buildActiveCmdComparisonCandidateText(),
      });
      await copyText(collaborationReportText);
      toast.success(formatCopySuccessMessage('排查报告', collaborationReportText), { duration: 2000 });
    } catch (error) {
      showCopyError('复制协作排查报告失败:', error);
    }
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
      <div className="flex-1 min-h-0 overflow-y-auto bg-editor-bg p-3">
        {!report ? (
          <div className="h-full flex items-center justify-center text-xs text-gray-500">
            暂无深度解析上下文
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <TransformReportSummarySection
              report={report}
              reportView={reportView}
              issuePriorityCount={issuePriorityCount}
              isFilterPending={isFilterPending}
              hasTemplateFillTarget={Boolean(onOpenTemplateFill)}
              placeholderFillTemplateJsonText={placeholderFillTemplateJsonText}
              placeholderFillTemplateSummary={placeholderFillTemplateSummary}
              placeholderFillPanelTitle={placeholderFillPanelTitle}
              nextActions={nextActions}
              issueTriageItems={issueTriageItems}
              onFilter={setQuery}
              onOpenFirstCmdComparison={handleOpenFirstCmdComparison}
              onOpenPlaceholderFillTemplate={handleOpenPlaceholderFillTemplate}
              onRunNextAction={runNextAction}
              onRunIssueTriageAction={runIssueTriageAction}
            />

            <TransformReportFilterBar
              query={query}
              isFilterPending={isFilterPending}
              onQueryChange={setQuery}
            />

            {reportView && reportView.filteredRecordCount > 0 && (
              <TransformReportRecordsSection
                records={reportView.records}
                filteredRecordCount={reportView.filteredRecordCount}
                isRecordTruncated={reportView.isRecordTruncated}
                cmdComparisonRecordPath={cmdComparisonRecordPath}
                cmdComparisonActualCandidate={cmdComparisonActualCandidate}
                cmdComparisonExpectedText={cmdComparisonExpectedText}
                cmdComparisonIgnoreExtraPaths={cmdComparisonIgnoreExtraPaths}
                getCmdComparisonCandidateRecords={() => getCmdComparisonCandidateRecordsForPanel(activeCmdComparisonState)}
                onCopyPath={handleCopyPath}
                onCopyOriginalValue={handleCopyOriginalValue}
                onCopyDecodedPathValue={handleCopyDecodedPathValue}
                onCopyCmdStructure={handleCopyCmdStructure}
                onCopyCmdComparisonPackage={handleCopyCmdComparisonPackage}
                onToggleCmdComparison={handleToggleCmdComparison}
                onCopyCmdComparisonDiff={handleCopyCmdComparisonDiff}
                onSwitchCmdComparisonCandidate={handleSwitchCmdComparisonCandidate}
                onCmdComparisonExpectedTextChange={setCmdComparisonExpectedText}
                onCmdComparisonIgnoreExtraPathsChange={setCmdComparisonIgnoreExtraPaths}
                onFilter={setQuery}
                onLocatePath={onLocatePath ? handleLocatePath : undefined}
                onOpenSchemeValue={onOpenSchemeValue ? handleOpenSchemeValue : undefined}
              />
            )}

            {reportView && reportView.filteredUnresolvedCount > 0 && (
              <TransformReportUnresolvedSection
                unresolvedCandidates={reportView.unresolvedCandidates}
                filteredUnresolvedCount={reportView.filteredUnresolvedCount}
                isUnresolvedTruncated={reportView.isUnresolvedTruncated}
                onCopyPath={handleCopyPath}
                onCopyOriginalValue={handleCopyOriginalValue}
                onLocatePath={onLocatePath ? handleLocatePath : undefined}
                onOpenSchemeValue={onOpenSchemeValue ? handleOpenSchemeValue : undefined}
              />
            )}

            {reportView && reportView.filteredPlaceholderCount > 0 && (
              <TransformReportPlaceholdersSection
                runtimePlaceholderGroups={reportView.runtimePlaceholderGroups}
                runtimePlaceholders={reportView.runtimePlaceholders}
                filteredPlaceholderCount={reportView.filteredPlaceholderCount}
                isPlaceholderTruncated={reportView.isPlaceholderTruncated}
                canShowOpenTemplateFill={Boolean(onOpenTemplateFill)}
                isPlaceholderFillTemplateDisabled={!placeholderFillTemplateJsonText || isFilterPending}
                isCopyPlaceholderReportDisabled={isFilterPending}
                openTemplateFillTitle={getPanelPlaceholderFillTemplateTitle('把当前筛选下的运行时占位符回填模板填入模板填充面板')}
                copyTemplateTitle={getPanelPlaceholderFillTemplateTitle('复制当前筛选下的运行时占位符回填模板')}
                copyPlaceholderReportTitle={isFilterPending ? '筛选结果仍在更新，请稍后复制占位符摘要' : '复制当前筛选下的运行时占位符摘要'}
                onOpenPlaceholderFillTemplate={handleOpenPlaceholderFillTemplate}
                onCopyPlaceholderFillTemplate={handleCopyPlaceholderFillTemplate}
                onCopyPlaceholderReport={handleCopyPlaceholderReport}
                onFilter={setQuery}
                onCopyPath={handleCopyPath}
                onCopyOriginalValue={handleCopyOriginalValue}
                onLocatePath={onLocatePath ? handleLocatePath : undefined}
                onOpenSchemeValue={onOpenSchemeValue ? handleOpenSchemeValue : undefined}
              />
            )}

            {reportView && reportView.filteredWarningCount > 0 && (
              <TransformReportWarningsSection
                warnings={reportView.warnings}
                filteredWarningCount={reportView.filteredWarningCount}
                isWarningTruncated={reportView.isWarningTruncated}
                onCopyPath={handleCopyPath}
                onCopyOriginalValue={handleCopyOriginalValue}
                onLocatePath={onLocatePath ? handleLocatePath : undefined}
                onOpenSchemeValue={onOpenSchemeValue ? handleOpenSchemeValue : undefined}
              />
            )}

            {reportView &&
              reportView.filteredRecordCount === 0 &&
              reportView.filteredPlaceholderCount === 0 &&
              reportView.filteredUnresolvedCount === 0 &&
              reportView.filteredWarningCount === 0 && (
              <TransformReportEmptyState
                query={query}
                onClearFilter={() => setQuery('')}
              />
            )}
          </div>
        )}
      </div>
    </DraggablePanel>
  );
};
