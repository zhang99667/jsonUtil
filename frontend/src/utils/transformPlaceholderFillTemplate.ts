import { APP_VERSION_METADATA } from './appVersion';
import { buildPlaceholderReplacementSuggestions } from './transformPlaceholderSuggestions';
import type {
  TransformPlaceholderFillTemplate,
  TransformReportView,
} from './transformSummary';

const formatPlaceholderFillTemplateFilter = (filter?: string): string => filter?.trim() || '全部';

export const buildTransformPlaceholderFillTemplate = (
  reportView: TransformReportView,
  filter = '',
  suggestionSourceView = reportView
): TransformPlaceholderFillTemplate | null => {
  if (reportView.filteredPlaceholderCount === 0) return null;

  const replacementSuggestions = buildPlaceholderReplacementSuggestions(reportView, suggestionSourceView);
  const placeholderDetails = reportView.runtimePlaceholderGroups.map(group => {
    const suggestion = replacementSuggestions.get(group.value);

    return {
      value: group.value,
      replacement: suggestion?.replacement || '',
      ...(suggestion ? { suggestion } : {}),
      description: group.description,
      count: group.count,
      sourceCount: group.sourceCount,
      sources: group.sources.map(source => ({
        sourcePath: source.sourcePath,
        ...(source.sourceLabel ? { sourceLabel: source.sourceLabel } : {}),
        count: source.count,
        ...(source.sourceOriginalPreview ? { sourceOriginalPreview: source.sourceOriginalPreview } : {}),
      })),
    };
  });

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
