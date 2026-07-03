import type { TransformReportView } from './transformSummary';
import { buildTransformReportPlaceholderToolbarState } from './transformReportPlaceholderToolbarState';
import type { TransformReportPlaceholderToolbarState } from './transformReportPlaceholderToolbarState';

interface TransformReportPanelPlaceholderModelInput {
  reportView: TransformReportView | null;
  isFilterPending: boolean;
  hasTemplateFillTarget: boolean;
  hasPlaceholderFillTemplate: boolean;
  formatPlaceholderFillTitle: (readyTitle: string) => string;
}

export interface TransformReportPanelPlaceholderModel {
  placeholderFillPanelTitle: string;
  canOpenPlaceholderFill: boolean;
  placeholderToolbarState: TransformReportPlaceholderToolbarState | null;
}

export const buildTransformReportPanelPlaceholderModel = ({
  reportView,
  isFilterPending,
  hasTemplateFillTarget,
  hasPlaceholderFillTemplate,
  formatPlaceholderFillTitle,
}: TransformReportPanelPlaceholderModelInput): TransformReportPanelPlaceholderModel => {
  const placeholderFillPanelTitle = formatPlaceholderFillTitle('把运行时占位符回填模板填入模板填充面板');
  const canOpenPlaceholderFill = Boolean(hasTemplateFillTarget && hasPlaceholderFillTemplate && !isFilterPending);
  const placeholderToolbarState = reportView ? buildTransformReportPlaceholderToolbarState({
    filteredPlaceholderCount: reportView.filteredPlaceholderCount,
    isPlaceholderTruncated: reportView.isPlaceholderTruncated,
    hasTemplateFillTarget,
    hasPlaceholderFillTemplate,
    isFilterPending,
    formatTemplateFillTitle: formatPlaceholderFillTitle,
  }) : null;

  return {
    placeholderFillPanelTitle,
    canOpenPlaceholderFill,
    placeholderToolbarState,
  };
};
