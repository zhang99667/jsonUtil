import {
  formatTransformArchivePackageJsonText,
  formatTransformCollaborationReportText,
  formatTransformContextReportText,
  formatTransformDiagnosticSummaryText,
  formatTransformQualitySnapshotJsonText,
  formatTransformReportViewText,
  formatTransformTroubleshootingRecipeJsonText,
} from './transformSummary';
import { formatCopySuccessMessage } from './transformReportCopyMetrics';
import {
  buildReportCopyCmdComparisonContext,
  copyCmdStructureReportText,
  copyPathValueReportText,
  copyReportViewText,
} from './transformReportPanelReportCopyActions';
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
  const copyReport = async () => {
    if (!state.activeContext) return;

    await copyPanelText({
      text: formatTransformContextReportText(state.activeContext),
      successMessage: text => formatCopySuccessMessage('解析报告', text),
      errorLogMessage: '复制深度解析报告失败:',
    });
  };

  const copyFilteredReport = async () => {
    await copyReportViewText({
      state,
      copyPanelText,
      label: '筛选结果',
      errorLogMessage: '复制深度解析筛选结果失败:',
      formatText: formatTransformReportViewText,
    });
  };

  const copyDiagnosticSummary = async () => {
    await copyReportViewText({
      state,
      copyPanelText,
      label: '诊断摘要',
      errorLogMessage: '复制深度解析诊断摘要失败:',
      formatText: formatTransformDiagnosticSummaryText,
    });
  };

  const copyQualitySnapshot = async () => {
    await copyReportViewText({
      state,
      copyPanelText,
      label: '质量快照',
      errorLogMessage: '复制深度解析质量快照失败:',
      formatText: formatTransformQualitySnapshotJsonText,
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
    await copyReportViewText({
      state,
      copyPanelText,
      label: '归档包',
      errorLogMessage: '复制深度解析归档包失败:',
      formatText: (report, reportView, query) => formatTransformArchivePackageJsonText(
        report,
        reportView,
        query,
        buildReportCopyCmdComparisonContext(effects)
      ),
    });
  };

  const copyTroubleshootingRecipe = async () => {
    await copyReportViewText({
      state,
      copyPanelText,
      label: '排查 recipe',
      errorLogMessage: '复制深度解析排查 recipe 失败:',
      formatText: formatTransformTroubleshootingRecipeJsonText,
    });
  };

  const copyPathValueReport = async () => {
    await copyPathValueReportText(state, copyPanelText);
  };

  const copyCmdStructureReport = async () => {
    await copyCmdStructureReportText(state, copyPanelText);
  };

  const copyCollaborationReport = async () => {
    await copyReportViewText({
      state,
      copyPanelText,
      label: '排查报告',
      errorLogMessage: '复制协作排查报告失败:',
      formatText: (report, reportView, query) => formatTransformCollaborationReportText(
        report,
        reportView,
        query,
        buildReportCopyCmdComparisonContext(effects)
      ),
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
