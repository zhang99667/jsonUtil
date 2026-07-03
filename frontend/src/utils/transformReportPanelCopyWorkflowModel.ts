import {
  buildActiveCmdComparisonCandidateText,
  buildActiveCmdComparisonReportText,
  getCmdComparisonCandidateRecords,
} from './transformReportActiveCmdComparison';
import type { TransformReportCmdComparisonState } from './transformReportCmdComparisonController';
import {
  buildTransformReportPanelCopyWorkflow,
  type TransformReportPanelCopyWorkflow,
  type TransformReportPanelCopyWorkflowEffects,
  type TransformReportPanelCopyWorkflowState,
} from './transformReportPanelCopyWorkflow';
import type { TransformReportRecord, TransformReportView } from './transformSummary';

export type TransformReportPanelCopyWorkflowModelEffects = Omit<
  TransformReportPanelCopyWorkflowEffects,
  'buildActiveCmdComparisonReportText' | 'buildActiveCmdComparisonCandidateText'
>;

interface TransformReportPanelCopyWorkflowModelInput {
  copyWorkflowState: TransformReportPanelCopyWorkflowState;
  cmdComparisonState: TransformReportCmdComparisonState;
  fullReportView: TransformReportView | null;
  effects: TransformReportPanelCopyWorkflowModelEffects;
}

interface TransformReportPanelCopyWorkflowModel {
  copyWorkflow: TransformReportPanelCopyWorkflow;
  getCmdComparisonCandidateRecords: () => TransformReportRecord[];
}

export const buildTransformReportPanelCopyWorkflowModel = ({
  copyWorkflowState,
  cmdComparisonState,
  fullReportView,
  effects,
}: TransformReportPanelCopyWorkflowModelInput): TransformReportPanelCopyWorkflowModel => {
  const activeCmdComparisonState = {
    ...cmdComparisonState,
    report: copyWorkflowState.report,
    reportView: copyWorkflowState.reportView,
    fullReportView,
  };

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
