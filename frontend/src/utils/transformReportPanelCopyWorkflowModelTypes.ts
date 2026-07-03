import type { TransformReportCmdComparisonState } from './transformReportCmdComparisonController';
import type {
  TransformReportPanelCopyWorkflow,
  TransformReportPanelCopyWorkflowEffects,
  TransformReportPanelCopyWorkflowState,
} from './transformReportPanelCopyWorkflow';
import type { TransformReportRecord, TransformReportView } from './transformSummary';

export type TransformReportPanelCopyWorkflowModelEffects = Omit<
  TransformReportPanelCopyWorkflowEffects,
  'buildActiveCmdComparisonReportText' | 'buildActiveCmdComparisonCandidateText'
>;

export interface TransformReportPanelCopyWorkflowModelInput {
  copyWorkflowState: TransformReportPanelCopyWorkflowState;
  cmdComparisonState: TransformReportCmdComparisonState;
  fullReportView: TransformReportView | null;
  effects: TransformReportPanelCopyWorkflowModelEffects;
}

export interface TransformReportPanelCopyWorkflowModel {
  copyWorkflow: TransformReportPanelCopyWorkflow;
  getCmdComparisonCandidateRecords: () => TransformReportRecord[];
}
