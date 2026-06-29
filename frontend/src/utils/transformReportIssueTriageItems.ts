import type {
  TransformReportIssueTriageItem,
  TransformReportIssueTriageState,
} from './transformReportActionItemTypes';
import {
  ISSUE_TRIAGE_STATIC_CONFIGS,
  getPlaceholderIssueTriageConfig,
} from './transformReportActionItemConfig';

export const buildTransformReportIssueTriageItems = (
  state: TransformReportIssueTriageState
): TransformReportIssueTriageItem[] => [
  ...(state.warningCount > 0 ? [{
    ...ISSUE_TRIAGE_STATIC_CONFIGS.warning,
    count: state.warningCount,
  }] : []),
  ...(state.unresolvedCount > 0 ? [{
    ...ISSUE_TRIAGE_STATIC_CONFIGS.unresolved,
    count: state.unresolvedCount,
  }] : []),
  ...(state.placeholderCount > 0 ? [{
    ...getPlaceholderIssueTriageConfig(state.canOpenPlaceholderFill),
    count: state.placeholderCount,
    title: state.placeholderFillTitle,
  }] : []),
];
