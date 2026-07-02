import {
  formatTransformContextReportText,
} from './transformSummary';
import { formatCopySuccessMessage } from './transformReportCopyMetrics';
import {
  copyCmdStructureReportText,
  copyPathValueReportText,
} from './transformReportPanelReportCopyActions';
import { buildTransformReportPanelQualityBaselineWorkflow } from './transformReportPanelQualityBaselineWorkflow';
import { buildTransformReportPanelReportViewCopyWorkflow } from './transformReportPanelReportViewCopyWorkflow';
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

  const copyPathValueReport = async () => {
    await copyPathValueReportText(state, copyPanelText);
  };

  const copyCmdStructureReport = async () => {
    await copyCmdStructureReportText(state, copyPanelText);
  };

  return {
    copyReport,
    ...buildTransformReportPanelReportViewCopyWorkflow(state, effects, copyPanelText),
    ...buildTransformReportPanelQualityBaselineWorkflow(state, effects, copyPanelText),
    copyPathValueReport,
    copyCmdStructureReport,
  };
};
