import {
  formatTransformArchivePackageJsonText,
  formatTransformCmdStructureReportText,
  formatTransformCollaborationReportText,
  formatTransformContextReportText,
  formatTransformDiagnosticSummaryText,
  formatTransformPathValueReportText,
  formatTransformQualitySnapshotJsonText,
  formatTransformReportViewText,
  formatTransformTroubleshootingRecipeJsonText,
} from './transformSummary';
import {
  formatCopySuccessMessage,
  formatPathValueCopyCountLabel,
  getPathValueCopyRowCount,
  isPathValueCopyLimited,
} from './transformReportCopyMetrics';
import type {
  TransformReportPanelCopyTextRunner,
  TransformReportPanelCopyWorkflowEffects,
  TransformReportPanelCopyWorkflowState,
  TransformReportPanelReportCopyWorkflow,
} from './transformReportPanelCopyWorkflowTypes';

export const buildTransformReportPanelReportCopyWorkflow = (
  state: TransformReportPanelCopyWorkflowState,
  effects: TransformReportPanelCopyWorkflowEffects,
  copyPanelText: TransformReportPanelCopyTextRunner
): TransformReportPanelReportCopyWorkflow => {
  const hasReportView = Boolean(state.report && state.reportView && !state.isFilterPending);

  const copyReport = async () => {
    if (!state.activeContext) return;

    await copyPanelText({
      text: formatTransformContextReportText(state.activeContext),
      successMessage: text => formatCopySuccessMessage('解析报告', text),
      errorLogMessage: '复制深度解析报告失败:',
    });
  };

  const copyFilteredReport = async () => {
    if (!state.report || !state.reportView || state.isFilterPending) return;

    await copyPanelText({
      text: formatTransformReportViewText(state.report, state.reportView, state.deferredQuery),
      successMessage: text => formatCopySuccessMessage('筛选结果', text),
      errorLogMessage: '复制深度解析筛选结果失败:',
    });
  };

  const copyDiagnosticSummary = async () => {
    if (!hasReportView || !state.report || !state.reportView) return;

    await copyPanelText({
      text: formatTransformDiagnosticSummaryText(state.report, state.reportView, state.deferredQuery),
      successMessage: text => formatCopySuccessMessage('诊断摘要', text),
      errorLogMessage: '复制深度解析诊断摘要失败:',
    });
  };

  const copyQualitySnapshot = async () => {
    if (!hasReportView || !state.report || !state.reportView) return;

    await copyPanelText({
      text: formatTransformQualitySnapshotJsonText(state.report, state.reportView, state.deferredQuery),
      successMessage: text => formatCopySuccessMessage('质量快照', text),
      errorLogMessage: '复制深度解析质量快照失败:',
    });
  };

  const setQualityBaseline = () => {
    if (!state.qualitySnapshot || state.isFilterPending) return;

    effects.setQualityBaseline({
      snapshot: state.qualitySnapshot,
      filter: state.deferredQuery.trim() || '全部',
    });
    effects.showStatusSuccess('已设为临时质量基线', { duration: 1600 });
  };

  const copyQualityBaselineDelta = async () => {
    if (!state.qualityBaselineDeltaText || state.isFilterPending) return;

    await copyPanelText({
      text: state.qualityBaselineDeltaText,
      successMessage: text => formatCopySuccessMessage('质量对比', text),
      errorLogMessage: '复制深度解析质量对比失败:',
    });
  };

  const clearQualityBaseline = () => {
    effects.setQualityBaseline(null);
    effects.showStatusSuccess('临时质量基线已清除', { duration: 1600 });
  };

  const copyArchivePackage = async () => {
    if (!hasReportView || !state.report || !state.reportView) return;

    await copyPanelText({
      text: formatTransformArchivePackageJsonText(state.report, state.reportView, state.deferredQuery, {
        cmdComparisonReportText: effects.buildActiveCmdComparisonReportText(),
        cmdComparisonCandidateText: effects.buildActiveCmdComparisonCandidateText(),
      }),
      successMessage: text => formatCopySuccessMessage('归档包', text),
      errorLogMessage: '复制深度解析归档包失败:',
    });
  };

  const copyTroubleshootingRecipe = async () => {
    if (!hasReportView || !state.report || !state.reportView) return;

    await copyPanelText({
      text: formatTransformTroubleshootingRecipeJsonText(state.report, state.reportView, state.deferredQuery),
      successMessage: text => formatCopySuccessMessage('排查 recipe', text),
      errorLogMessage: '复制深度解析排查 recipe 失败:',
    });
  };

  const copyPathValueReport = async () => {
    if (!state.reportView || !state.hasPathValueCopyItems || state.isFilterPending) return;

    await copyPanelText({
      text: formatTransformPathValueReportText(state.reportView),
      successMessage: `已复制路径和值（${formatPathValueCopyCountLabel(
        getPathValueCopyRowCount(state.reportView.records),
        isPathValueCopyLimited(state.reportView.records, state.reportView.isRecordTruncated)
      )}）`,
      errorLogMessage: '复制深度解析路径和值失败:',
    });
  };

  const copyCmdStructureReport = async () => {
    if (!hasReportView || !state.report || !state.reportView || !state.hasCmdStructureCopyItems) return;

    await copyPanelText({
      text: formatTransformCmdStructureReportText(state.report, state.reportView, state.deferredQuery),
      successMessage: state.hasFocusedCmdStructureCopyItems ? '已复制聚焦 CMD 结构列表' : '已复制 CMD 结构列表',
      errorLogMessage: '复制深度解析 CMD 结构列表失败:',
    });
  };

  const copyCollaborationReport = async () => {
    if (!hasReportView || !state.report || !state.reportView) return;

    await copyPanelText({
      text: formatTransformCollaborationReportText(state.report, state.reportView, state.deferredQuery, {
        cmdComparisonReportText: effects.buildActiveCmdComparisonReportText(),
        cmdComparisonCandidateText: effects.buildActiveCmdComparisonCandidateText(),
      }),
      successMessage: text => formatCopySuccessMessage('排查报告', text),
      errorLogMessage: '复制协作排查报告失败:',
    });
  };

  return {
    copyReport,
    copyFilteredReport,
    copyDiagnosticSummary,
    copyQualitySnapshot,
    setQualityBaseline,
    copyQualityBaselineDelta,
    clearQualityBaseline,
    copyArchivePackage,
    copyTroubleshootingRecipe,
    copyPathValueReport,
    copyCmdStructureReport,
    copyCollaborationReport,
  };
};
