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
import { buildTransformReportPanelQualityBaselineWorkflow } from './transformReportPanelQualityBaselineWorkflow';
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
    ...buildTransformReportPanelQualityBaselineWorkflow(state, effects, copyPanelText),
    copyArchivePackage,
    copyTroubleshootingRecipe,
    copyPathValueReport,
    copyCmdStructureReport,
    copyCollaborationReport,
  };
};
