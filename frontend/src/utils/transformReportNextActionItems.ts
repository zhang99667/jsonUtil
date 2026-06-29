import type {
  TransformReportNextActionItem,
  TransformReportNextActionState,
} from './transformReportActionItemTypes';
import {
  NEXT_ACTION_STATIC_CONFIGS,
  getPlaceholderNextActionConfig,
} from './transformReportActionItemConfig';

const appendNextAction = (
  actions: TransformReportNextActionItem[],
  item: TransformReportNextActionItem
): void => {
  if (actions.length < 3) actions.push(item);
};

export const buildTransformReportNextActionItems = (
  state: TransformReportNextActionState
): TransformReportNextActionItem[] => {
  const actions: TransformReportNextActionItem[] = [];

  if (state.hasReport && state.hasFilteredCmdStructure) {
    appendNextAction(actions, {
      ...NEXT_ACTION_STATIC_CONFIGS.compareCmd,
      disabled: state.isFilterPending,
    });
  }

  if (state.hasPlaceholders) {
    appendNextAction(actions, {
      ...getPlaceholderNextActionConfig(state.canOpenPlaceholderFill),
      title: state.placeholderFillTitle,
      disabled: state.isFilterPending,
    });
  } else if (state.issuePriorityCount > 0) {
    appendNextAction(actions, {
      ...NEXT_ACTION_STATIC_CONFIGS.triage,
      disabled: state.isFilterPending,
    });
  }

  if (state.hasReportView) {
    appendNextAction(actions, {
      ...NEXT_ACTION_STATIC_CONFIGS.archive,
      title: state.archivePackageTitle,
      disabled: state.isFilterPending,
    });
    appendNextAction(actions, {
      ...NEXT_ACTION_STATIC_CONFIGS.collaboration,
      title: state.collaborationReportTitle,
      disabled: state.isFilterPending,
    });
    appendNextAction(actions, {
      ...NEXT_ACTION_STATIC_CONFIGS.qualitySnapshot,
      title: state.qualitySnapshotTitle,
      disabled: state.isFilterPending,
    });
  }

  return actions;
};
