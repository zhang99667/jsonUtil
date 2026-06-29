import {
  type ConfiguredFooterAction,
  isConfiguredActionDisabled,
} from './transformReportFooterActionConfig';
import type {
  TransformReportFooterAction,
  TransformReportFooterActionState,
} from './transformReportFooterActionTypes';
import { createFooterAction } from './transformReportFooterActionFactory';

export const buildConfiguredFooterActions = (
  state: TransformReportFooterActionState,
  configs: ConfiguredFooterAction[],
  reportCopyDisabled: boolean
): TransformReportFooterAction[] => configs.map(config => createFooterAction({
  id: config.id,
  dataTour: config.dataTour,
  label: config.label,
  title: state.copyTitles[config.titleKey],
  ariaPrefix: config.ariaPrefix,
  disabled: isConfiguredActionDisabled(state, config, reportCopyDisabled),
  tone: config.tone,
}));

export const buildFilteredReportFooterActions = (
  state: TransformReportFooterActionState,
  reportCopyDisabled: boolean
): TransformReportFooterAction[] => (
  state.hasQuery
    ? [createFooterAction({
        id: 'copy-filtered-report',
        label: '复制筛选结果',
        title: state.copyTitles.filteredReport,
        disabled: reportCopyDisabled,
        tone: 'cyan',
      })]
    : []
);

export const buildCmdStructureFooterActions = (
  state: TransformReportFooterActionState
): TransformReportFooterAction[] => {
  if (!state.hasCmdStructureCopyItems) return [];

  const label = state.hasFocusedCmdStructureCopyItems ? '复制聚焦 CMD' : '复制 CMD 结构';
  return [createFooterAction({
    id: 'copy-cmd-structures',
    dataTour: 'transform-report-copy-cmd-structures',
    label,
    title: state.copyTitles.cmdStructures,
    disabled: state.isFilterPending,
    tone: 'neutral',
  })];
};
