import {
  BODY_FOOTER_ACTIONS,
  HEADER_FOOTER_ACTIONS,
  TAIL_FOOTER_ACTIONS,
} from './transformReportFooterActionConfig';
import {
  buildCmdStructureFooterActions,
  buildConfiguredFooterActions,
  buildFilteredReportFooterActions,
} from './transformReportFooterActionBuilders';
import { buildQualityBaselineFooterActions } from './transformReportFooterBaselineActions';
import type {
  TransformReportFooterAction,
  TransformReportFooterActionState,
} from './transformReportFooterActionTypes';

export type {
  TransformReportFooterAction,
  TransformReportFooterActionId,
  TransformReportFooterActionState,
} from './transformReportFooterActionTypes';
export {
  buildTransformReportFooterActionHandlers,
  type TransformReportFooterActionHandlerDependencies,
  type TransformReportFooterActionHandlers,
} from './transformReportFooterActionHandlers';

export const buildTransformReportFooterActions = (
  state: TransformReportFooterActionState
): TransformReportFooterAction[] => {
  const reportCopyDisabled = !state.hasReportView || state.isFilterPending;
  return [
    ...buildFilteredReportFooterActions(state, reportCopyDisabled),
    ...buildConfiguredFooterActions(state, HEADER_FOOTER_ACTIONS, reportCopyDisabled),
    ...buildQualityBaselineFooterActions(state),
    ...buildConfiguredFooterActions(state, BODY_FOOTER_ACTIONS, reportCopyDisabled),
    ...buildCmdStructureFooterActions(state),
    ...buildConfiguredFooterActions(state, TAIL_FOOTER_ACTIONS, reportCopyDisabled),
  ];
};
