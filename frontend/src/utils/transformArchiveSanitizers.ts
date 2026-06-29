import type {
  TransformIssueSampleExport,
  TransformPlaceholderFillTemplate,
} from './transformSummary';

export const ARCHIVE_OMITTED_ORIGINAL_VALUE = '[已省略，归档包默认不携带原始字段值]';
const ARCHIVE_OMITTED_ORIGINAL_HINT = '归档包默认省略原始值，沉淀 corpus 前请从已脱敏 response 补齐';

export const sanitizeTransformIssueSampleExportForArchive = (
  sampleExport: TransformIssueSampleExport | null
): TransformIssueSampleExport | null => {
  if (!sampleExport) return null;

  return {
    ...sampleExport,
    samples: sampleExport.samples.map(sample => ({
      ...sample,
      originalValue: sample.redactionHint ? sample.originalValue : ARCHIVE_OMITTED_ORIGINAL_VALUE,
      redactionHint: sample.redactionHint || ARCHIVE_OMITTED_ORIGINAL_HINT,
    })),
  };
};

export const sanitizeTransformPlaceholderFillTemplateForArchive = (
  fillTemplate: TransformPlaceholderFillTemplate | null
): TransformPlaceholderFillTemplate | null => {
  if (!fillTemplate) return null;

  return {
    ...fillTemplate,
    placeholders: Object.fromEntries(
      fillTemplate.placeholderDetails.map(detail => [detail.value, ''])
    ),
    placeholderDetails: fillTemplate.placeholderDetails.map(detail => ({
      value: detail.value,
      replacement: '',
      description: detail.description,
      count: detail.count,
      sourceCount: detail.sourceCount,
      sources: detail.sources.map(source => ({
        sourcePath: source.sourcePath,
        ...(source.sourceLabel ? { sourceLabel: source.sourceLabel } : {}),
        count: source.count,
      })),
    })),
  };
};
