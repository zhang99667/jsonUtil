import type { TransformReportPanelCopyWorkflowModelInput } from './transformReportPanelCopyWorkflowModelTypes';

export const buildTransformReportPanelActiveCmdComparisonState = ({
  copyWorkflowState,
  cmdComparisonState,
  fullReportView,
}: Pick<
  TransformReportPanelCopyWorkflowModelInput,
  'copyWorkflowState' | 'cmdComparisonState' | 'fullReportView'
>) => ({
  ...cmdComparisonState,
  report: copyWorkflowState.report,
  reportView: copyWorkflowState.reportView,
  fullReportView,
});
