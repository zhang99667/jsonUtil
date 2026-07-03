import {
  buildActiveCmdComparisonCandidateText,
  buildActiveCmdComparisonReportText,
  getCmdComparisonCandidateRecords,
} from './transformReportActiveCmdComparison';
import { buildTransformReportPanelCopyWorkflow } from './transformReportPanelCopyWorkflow';
import { buildTransformReportPanelActiveCmdComparisonState } from './transformReportPanelActiveCmdComparisonState';
import type {
  TransformReportPanelCopyWorkflowModel,
  TransformReportPanelCopyWorkflowModelInput,
} from './transformReportPanelCopyWorkflowModelTypes';

export type { TransformReportPanelCopyWorkflowModelEffects } from './transformReportPanelCopyWorkflowModelTypes';

export const buildTransformReportPanelCopyWorkflowModel = ({
  copyWorkflowState,
  cmdComparisonState,
  fullReportView,
  effects,
}: TransformReportPanelCopyWorkflowModelInput): TransformReportPanelCopyWorkflowModel => {
  const activeCmdComparisonState = buildTransformReportPanelActiveCmdComparisonState({
    copyWorkflowState,
    cmdComparisonState,
    fullReportView,
  });

  return {
    copyWorkflow: buildTransformReportPanelCopyWorkflow(copyWorkflowState, {
      ...effects,
      buildActiveCmdComparisonReportText: () => (
        buildActiveCmdComparisonReportText(activeCmdComparisonState)
      ),
      buildActiveCmdComparisonCandidateText: () => (
        buildActiveCmdComparisonCandidateText(activeCmdComparisonState)
      ),
    }),
    getCmdComparisonCandidateRecords: () => (
      getCmdComparisonCandidateRecords(activeCmdComparisonState)
    ),
  };
};
