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
} from './transformReportPanelCopyWorkflowTypes';
import {
  formatTransformCmdStructureReportText,
  formatTransformPathValueReportText,
  type TransformContextReport,
  type TransformReportView,
} from './transformSummary';

interface ReportViewCopyAction {
  state: TransformReportPanelCopyWorkflowState;
  copyPanelText: TransformReportPanelCopyTextRunner;
  label: string;
  errorLogMessage: string;
  formatText: (report: TransformContextReport, reportView: TransformReportView, query: string) => string;
}

export const copyReportViewText = async ({
  state,
  copyPanelText,
  label,
  errorLogMessage,
  formatText,
}: ReportViewCopyAction): Promise<void> => {
  if (!state.report || !state.reportView || state.isFilterPending) return;

  await copyPanelText({
    text: formatText(state.report, state.reportView, state.deferredQuery),
    successMessage: text => formatCopySuccessMessage(label, text),
    errorLogMessage,
  });
};

export const buildReportCopyCmdComparisonContext = (
  effects: TransformReportPanelCopyWorkflowEffects
) => ({
  cmdComparisonReportText: effects.buildActiveCmdComparisonReportText(),
  cmdComparisonCandidateText: effects.buildActiveCmdComparisonCandidateText(),
});

export const copyPathValueReportText = async (
  state: TransformReportPanelCopyWorkflowState,
  copyPanelText: TransformReportPanelCopyTextRunner
): Promise<void> => {
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

export const copyCmdStructureReportText = async (
  state: TransformReportPanelCopyWorkflowState,
  copyPanelText: TransformReportPanelCopyTextRunner
): Promise<void> => {
  if (!state.report || !state.reportView || state.isFilterPending || !state.hasCmdStructureCopyItems) return;

  await copyPanelText({
    text: formatTransformCmdStructureReportText(state.report, state.reportView, state.deferredQuery),
    successMessage: state.hasFocusedCmdStructureCopyItems ? '已复制聚焦 CMD 结构列表' : '已复制 CMD 结构列表',
    errorLogMessage: '复制深度解析 CMD 结构列表失败:',
  });
};
