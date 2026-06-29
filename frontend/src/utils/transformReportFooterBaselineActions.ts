import type {
  TransformReportFooterAction,
  TransformReportFooterActionState,
} from './transformReportFooterActionTypes';
import { createFooterAction } from './transformReportFooterActionFactory';

export const buildQualityBaselineFooterActions = (
  state: TransformReportFooterActionState
): TransformReportFooterAction[] => {
  const actions: TransformReportFooterAction[] = [
    createFooterAction({
      id: 'set-quality-baseline',
      dataTour: 'transform-report-set-quality-baseline',
      label: '设为基线',
      title: state.isFilterPending ? '筛选结果仍在更新，请稍后设为基线' : '将当前不含原始 response 的质量快照设为临时基线',
      ariaLabel: '设为质量基线，将当前不含原始 response 的质量快照设为临时基线',
      disabled: !state.hasQualitySnapshot || state.isFilterPending,
      tone: 'neutral',
    }),
  ];

  if (state.qualityBaselineFilter) {
    actions.push(createFooterAction({
      id: 'copy-quality-baseline-delta',
      dataTour: 'transform-report-copy-quality-baseline-delta',
      label: '复制质量对比',
      title: `${state.copyTitles.qualityBaseline}；基线筛选: ${state.qualityBaselineFilter}`,
      ariaLabel: `复制质量对比，${state.copyTitles.qualityBaseline}`,
      disabled: !state.hasQualityBaselineDeltaText || state.isFilterPending,
      tone: 'success',
    }));
    actions.push(createFooterAction({
      id: 'clear-quality-baseline',
      dataTour: 'transform-report-clear-quality-baseline',
      label: '清除基线',
      title: `清除临时质量基线；基线筛选: ${state.qualityBaselineFilter}`,
      ariaLabel: '清除临时质量基线',
      disabled: false,
      tone: 'muted',
    }));
  }

  return actions;
};
