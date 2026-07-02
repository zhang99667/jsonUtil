import {
  formatTransformArchivePackageJsonText,
  formatTransformCollaborationReportText,
  formatTransformDiagnosticSummaryText,
  formatTransformQualitySnapshotJsonText,
  formatTransformReportViewText,
  formatTransformTroubleshootingRecipeJsonText,
  type TransformContextReport,
  type TransformReportView,
} from './transformSummary';
import {
  buildReportCopyCmdComparisonContext,
  copyReportViewText,
} from './transformReportPanelReportCopyActions';
import type {
  TransformReportPanelCopyTextRunner,
  TransformReportPanelCopyWorkflowEffects,
  TransformReportPanelCopyWorkflowState,
} from './transformReportPanelCopyWorkflowTypes';

interface TransformReportPanelReportViewCopyWorkflow {
  copyFilteredReport: () => Promise<void>;
  copyDiagnosticSummary: () => Promise<void>;
  copyQualitySnapshot: () => Promise<void>;
  copyArchivePackage: () => Promise<void>;
  copyTroubleshootingRecipe: () => Promise<void>;
  copyCollaborationReport: () => Promise<void>;
}

type ReportViewCopyFormatter = (
  report: TransformContextReport,
  reportView: TransformReportView,
  query: string
) => string;

interface ReportViewCopyActionConfig {
  label: string;
  errorLogMessage: string;
  formatText: ReportViewCopyFormatter;
}

const buildReportViewCopyAction = (
  state: TransformReportPanelCopyWorkflowState,
  copyPanelText: TransformReportPanelCopyTextRunner,
  config: ReportViewCopyActionConfig
) => async () => {
  await copyReportViewText({
    state,
    copyPanelText,
    ...config,
  });
};

export const buildTransformReportPanelReportViewCopyWorkflow = (
  state: TransformReportPanelCopyWorkflowState,
  effects: TransformReportPanelCopyWorkflowEffects,
  copyPanelText: TransformReportPanelCopyTextRunner
): TransformReportPanelReportViewCopyWorkflow => {
  return {
    copyFilteredReport: buildReportViewCopyAction(state, copyPanelText, {
      label: '筛选结果',
      errorLogMessage: '复制深度解析筛选结果失败:',
      formatText: formatTransformReportViewText,
    }),
    copyDiagnosticSummary: buildReportViewCopyAction(state, copyPanelText, {
      label: '诊断摘要',
      errorLogMessage: '复制深度解析诊断摘要失败:',
      formatText: formatTransformDiagnosticSummaryText,
    }),
    copyQualitySnapshot: buildReportViewCopyAction(state, copyPanelText, {
      label: '质量快照',
      errorLogMessage: '复制深度解析质量快照失败:',
      formatText: formatTransformQualitySnapshotJsonText,
    }),
    copyArchivePackage: buildReportViewCopyAction(state, copyPanelText, {
      label: '归档包',
      errorLogMessage: '复制深度解析归档包失败:',
      formatText: (report, reportView, query) => formatTransformArchivePackageJsonText(
        report,
        reportView,
        query,
        buildReportCopyCmdComparisonContext(effects)
      ),
    }),
    copyTroubleshootingRecipe: buildReportViewCopyAction(state, copyPanelText, {
      label: '排查 recipe',
      errorLogMessage: '复制深度解析排查 recipe 失败:',
      formatText: formatTransformTroubleshootingRecipeJsonText,
    }),
    copyCollaborationReport: buildReportViewCopyAction(state, copyPanelText, {
      label: '排查报告',
      errorLogMessage: '复制协作排查报告失败:',
      formatText: (report, reportView, query) => formatTransformCollaborationReportText(
        report,
        reportView,
        query,
        buildReportCopyCmdComparisonContext(effects)
      ),
    }),
  };
};
