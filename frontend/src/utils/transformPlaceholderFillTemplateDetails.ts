import type {
  PlaceholderReplacementSuggestion,
} from './transformPlaceholderSuggestions';
import type {
  TransformPlaceholderFillTemplateDetail,
} from './transformSummaryArtifactTypes';
import type {
  TransformReportRuntimePlaceholderGroup,
} from './transformRuntimePlaceholderTypes';

interface TransformPlaceholderFillTemplateDetailsView {
  runtimePlaceholderGroups: TransformReportRuntimePlaceholderGroup[];
}

export const buildTransformPlaceholderFillTemplateDetails = (
  reportView: TransformPlaceholderFillTemplateDetailsView,
  replacementSuggestions: ReadonlyMap<string, PlaceholderReplacementSuggestion>,
): TransformPlaceholderFillTemplateDetail[] => (
  reportView.runtimePlaceholderGroups.map(group => {
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
  })
);
