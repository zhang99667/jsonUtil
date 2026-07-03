import {
  buildTransformReportIssueTriageItems,
  buildTransformReportNextActionItems,
} from './transformReportActionItems';
import type {
  TransformReportPanelActionModel,
  TransformReportPanelActionModelInput,
} from './transformReportPanelActionModelTypes';
import { buildTransformReportPanelActionState } from './transformReportPanelActionState';

export type {
  TransformReportPanelActionModel,
  TransformReportPanelActionModelInput,
} from './transformReportPanelActionModelTypes';

export const buildTransformReportPanelActionModel = (
  input: TransformReportPanelActionModelInput
): TransformReportPanelActionModel => {
  const actionState = buildTransformReportPanelActionState(input);

  return {
    issuePriorityCount: actionState.issuePriorityCount,
    issueTriageItems: actionState.issueTriageState
      ? buildTransformReportIssueTriageItems(actionState.issueTriageState)
      : [],
    nextActions: buildTransformReportNextActionItems(actionState.nextActionState),
  };
};
