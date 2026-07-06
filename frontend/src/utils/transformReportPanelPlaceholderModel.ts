import type { TransformReportView } from './transformSummary';
import { getPlaceholderFillTemplateTitle, type PlaceholderFillSummary } from './transformReportPlaceholderFillSummary';
import { buildTransformReportPlaceholderToolbarState } from './transformReportPlaceholderToolbarState';
import type { TransformReportPlaceholderToolbarState } from './transformReportPlaceholderToolbarState';

interface TransformReportPanelPlaceholderModelInput {
  reportView: TransformReportView | null;
  isFilterPending: boolean;
  hasTemplateFillTarget: boolean;
  hasPlaceholderFillTemplate: boolean;
  placeholderFillTemplateSummary: PlaceholderFillSummary | null;
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
  placeholderFillTemplateSummary,
}: TransformReportPanelPlaceholderModelInput): TransformReportPanelPlaceholderModel => {
  const getTemplateFillTitle = (readyTitle: string): string => getPlaceholderFillTemplateTitle(readyTitle, hasPlaceholderFillTemplate, placeholderFillTemplateSummary, isFilterPending);
  const placeholderFillPanelTitle = getTemplateFillTitle('把运行时占位符回填模板填入模板填充面板');
  const canOpenPlaceholderFill = Boolean(hasTemplateFillTarget && hasPlaceholderFillTemplate && !isFilterPending);
  const placeholderToolbarState = reportView ? buildTransformReportPlaceholderToolbarState({
    filteredPlaceholderCount: reportView.filteredPlaceholderCount,
    isPlaceholderTruncated: reportView.isPlaceholderTruncated,
    hasTemplateFillTarget,
    hasPlaceholderFillTemplate,
    isFilterPending,
    formatTemplateFillTitle: getTemplateFillTitle,
  }) : null;

  return {
    placeholderFillPanelTitle,
    canOpenPlaceholderFill,
    placeholderToolbarState,
  };
};
