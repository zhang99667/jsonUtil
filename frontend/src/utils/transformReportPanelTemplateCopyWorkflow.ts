import {
  formatTransformPlaceholderReportText,
} from './transformSummary';
import type {
  TransformReportPanelCopyTextRunner,
  TransformReportPanelCopyWorkflowEffects,
  TransformReportPanelCopyWorkflowState,
  TransformReportPanelTemplateCopyWorkflow,
} from './transformReportPanelCopyWorkflowTypes';

interface GuardedTemplateCopyActionInput {
  getText: () => string;
  successMessage: string;
  errorLogMessage: string;
}

const buildGuardedTemplateCopyAction = (
  state: TransformReportPanelCopyWorkflowState,
  copyPanelText: TransformReportPanelCopyTextRunner,
  {
    getText,
    successMessage,
    errorLogMessage,
  }: GuardedTemplateCopyActionInput
) => async () => {
  const text = getText();
  if (!text || state.isFilterPending) return;

  await copyPanelText({ text, successMessage, errorLogMessage });
};

export const buildTransformReportPanelTemplateCopyWorkflow = (
  state: TransformReportPanelCopyWorkflowState,
  effects: TransformReportPanelCopyWorkflowEffects,
  copyPanelText: TransformReportPanelCopyTextRunner
): TransformReportPanelTemplateCopyWorkflow => {
  const hasReportView = Boolean(state.report && state.reportView && !state.isFilterPending);

  const copyPlaceholderReport = async () => {
    if (!hasReportView || !state.report || !state.reportView) return;

    await copyPanelText({
      text: formatTransformPlaceholderReportText(state.report, state.reportView, state.deferredQuery),
      successMessage: state.deferredQuery.trim() ? '已复制筛选占位符' : '已复制占位符摘要',
      errorLogMessage: '复制深度解析占位符失败:',
    });
  };

  const openPlaceholderFillTemplate = () => {
    if (!state.placeholderFillTemplateJsonText || state.isFilterPending || !effects.openTemplateFill) return;

    effects.openTemplateFill(state.placeholderFillTemplateJsonText);
    effects.showStatusSuccess('已填入模板填充', { duration: 1600 });
  };

  return {
    copyPlaceholderReport,
    copyPlaceholderFillTemplate: buildGuardedTemplateCopyAction(state, copyPanelText, {
      getText: () => state.placeholderFillTemplateJsonText,
      successMessage: '已复制占位符回填模板',
      errorLogMessage: '复制深度解析占位符回填模板失败:',
    }),
    openPlaceholderFillTemplate,
    copyIssueSamples: buildGuardedTemplateCopyAction(state, copyPanelText, {
      getText: () => state.issueSampleCopyText,
      successMessage: '已复制问题样本',
      errorLogMessage: '复制深度解析问题样本失败:',
    }),
    copyIssueSampleJson: buildGuardedTemplateCopyAction(state, copyPanelText, {
      getText: () => state.issueSampleJsonCopyText,
      successMessage: '已复制样本 JSON',
      errorLogMessage: '复制深度解析样本 JSON 失败:',
    }),
    copyRedactedIssueSampleJson: buildGuardedTemplateCopyAction(state, copyPanelText, {
      getText: () => state.redactedIssueSampleJsonCopyText,
      successMessage: '已复制脱敏样本 JSON',
      errorLogMessage: '复制深度解析脱敏样本 JSON 失败:',
    }),
    copyIssueRegressionTemplate: buildGuardedTemplateCopyAction(state, copyPanelText, {
      getText: () => state.issueRegressionTemplateCopyText,
      successMessage: '已复制回归模板',
      errorLogMessage: '复制深度解析回归模板失败:',
    }),
  };
};
