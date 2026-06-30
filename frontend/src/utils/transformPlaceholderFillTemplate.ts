import { APP_VERSION_METADATA } from './appVersion';
import { buildPlaceholderReplacementSuggestions } from './transformPlaceholderSuggestions';
import type {
  TransformPlaceholderFillTemplate,
  TransformReportView,
} from './transformSummary';
import { buildTransformPlaceholderFillTemplateDetails } from './transformPlaceholderFillTemplateDetails';

const formatPlaceholderFillTemplateFilter = (filter?: string): string => filter?.trim() || '全部';

export const buildTransformPlaceholderFillTemplate = (
  reportView: TransformReportView,
  filter = '',
  suggestionSourceView = reportView
): TransformPlaceholderFillTemplate | null => {
  if (reportView.filteredPlaceholderCount === 0) return null;

  const replacementSuggestions = buildPlaceholderReplacementSuggestions(reportView, suggestionSourceView);
  const placeholderDetails = buildTransformPlaceholderFillTemplateDetails(reportView, replacementSuggestions);

  return {
    schemaVersion: 1,
    kind: 'json-helper-runtime-placeholder-fill-template',
    tool: APP_VERSION_METADATA,
    filter: formatPlaceholderFillTemplateFilter(filter),
    summary: {
      groups: placeholderDetails.length,
      visibleOccurrences: reportView.runtimePlaceholders.length,
      filteredOccurrences: reportView.filteredPlaceholderCount,
      totalOccurrences: reportView.totalPlaceholderCount,
      truncated: reportView.isPlaceholderTruncated,
    },
    placeholders: Object.fromEntries(
      placeholderDetails.map(detail => [detail.value, detail.replacement])
    ),
    placeholderDetails,
  };
};

export const formatTransformPlaceholderFillTemplateJsonText = (
  reportView: TransformReportView,
  filter = '',
  suggestionSourceView = reportView
): string => {
  const fillTemplate = buildTransformPlaceholderFillTemplate(reportView, filter, suggestionSourceView);
  return fillTemplate ? JSON.stringify(fillTemplate, null, 2) : '';
};
