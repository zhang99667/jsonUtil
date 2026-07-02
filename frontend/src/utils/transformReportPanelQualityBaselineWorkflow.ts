import { formatCopySuccessMessage } from './transformReportCopyMetrics';
import type {
  TransformReportPanelCopyTextRunner,
  TransformReportPanelCopyWorkflowEffects,
  TransformReportPanelCopyWorkflowState,
  TransformReportPanelReportCopyWorkflow,
} from './transformReportPanelCopyWorkflowTypes';

type TransformReportPanelQualityBaselineWorkflow = Pick<
  TransformReportPanelReportCopyWorkflow,
  'setQualityBaseline' | 'copyQualityBaselineDelta' | 'clearQualityBaseline'
>;

export const buildTransformReportPanelQualityBaselineWorkflow = (
  state: TransformReportPanelCopyWorkflowState,
  effects: TransformReportPanelCopyWorkflowEffects,
  copyPanelText: TransformReportPanelCopyTextRunner
): TransformReportPanelQualityBaselineWorkflow => {
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

  return {
    setQualityBaseline,
    copyQualityBaselineDelta,
    clearQualityBaseline,
  };
};
