import type {
  TransformReportRuntimePlaceholder,
  TransformReportRuntimePlaceholderGroup,
  TransformReportRuntimePlaceholderSourceGroup,
} from './transformRuntimePlaceholderTypes';

export const buildRuntimePlaceholderGroups = (
  placeholders: TransformReportRuntimePlaceholder[]
): TransformReportRuntimePlaceholderGroup[] => {
  const groups = new Map<string, {
    value: string;
    description: string;
    count: number;
    sources: Map<string, TransformReportRuntimePlaceholderSourceGroup>;
  }>();

  placeholders.forEach(placeholder => {
    let group = groups.get(placeholder.value);
    if (!group) {
      group = {
        value: placeholder.value,
        description: placeholder.description,
        count: 0,
        sources: new Map(),
      };
      groups.set(placeholder.value, group);
    }

    group.count += 1;

    let source = group.sources.get(placeholder.sourcePath);
    if (!source) {
      source = {
        sourcePath: placeholder.sourcePath,
        ...(placeholder.sourceLabel ? { sourceLabel: placeholder.sourceLabel } : {}),
        ...(placeholder.sourceOriginalValue ? { sourceOriginalValue: placeholder.sourceOriginalValue } : {}),
        ...(placeholder.sourceOriginalPreview ? { sourceOriginalPreview: placeholder.sourceOriginalPreview } : {}),
        count: 0,
      };
      group.sources.set(placeholder.sourcePath, source);
    }

    source.count += 1;
  });

  return Array.from(groups.values()).map(group => {
    const sources = Array.from(group.sources.values()).sort((left, right) => (
      right.count - left.count || left.sourcePath.localeCompare(right.sourcePath)
    ));

    return {
      value: group.value,
      description: group.description,
      count: group.count,
      sourceCount: sources.length,
      sources,
    };
  }).sort((left, right) => (
    right.count - left.count || left.value.localeCompare(right.value)
  ));
};
