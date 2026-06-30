import {
  runTransformReportCopyText,
  type TransformReportCopyTextOptions,
} from './transformReportCopyActionRunner';
import { buildTransformReportPanelInlineCopyWorkflow } from './transformReportPanelInlineCopyWorkflow';
import { buildTransformReportPanelReportCopyWorkflow } from './transformReportPanelReportCopyWorkflow';
import { buildTransformReportPanelTemplateCopyWorkflow } from './transformReportPanelTemplateCopyWorkflow';
import type {
  TransformReportPanelCopyWorkflow,
  TransformReportPanelCopyWorkflowEffects,
  TransformReportPanelCopyWorkflowState,
} from './transformReportPanelCopyWorkflowTypes';

export type {
  TransformReportPanelCopyWorkflow,
  TransformReportPanelCopyWorkflowEffects,
  TransformReportPanelCopyWorkflowState,
  TransformReportQualityBaseline,
} from './transformReportPanelCopyWorkflowTypes';

export const buildTransformReportPanelCopyWorkflow = (
  state: TransformReportPanelCopyWorkflowState,
  effects: TransformReportPanelCopyWorkflowEffects
): TransformReportPanelCopyWorkflow => {
  const copyPanelText = async (options: TransformReportCopyTextOptions): Promise<void> => {
    await runTransformReportCopyText(options, effects);
  };

  return {
    ...buildTransformReportPanelReportCopyWorkflow(state, effects, copyPanelText),
    ...buildTransformReportPanelTemplateCopyWorkflow(state, effects, copyPanelText),
    ...buildTransformReportPanelInlineCopyWorkflow(state, copyPanelText),
  };
};
