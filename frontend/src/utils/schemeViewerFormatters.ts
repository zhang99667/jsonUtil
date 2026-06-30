import { formatByteSize, getDocumentStats } from './documentStats';
import type {
  DecodeLayer,
  SchemeParamDecodeStage,
} from './schemeTypes';

export const formatSchemeTextPreview = (value: string, maxLength: number): string => (
  value.length > maxLength ? `${value.slice(0, maxLength)}...` : value
);

export const formatSchemeJoinedValuePreview = (values: string[], maxLength: number): string => {
  let preview = '';

  for (const value of values) {
    const nextPreview = preview ? `${preview}, ${value}` : value;
    if (nextPreview.length > maxLength) {
      return `${nextPreview.slice(0, maxLength)}...`;
    }
    preview = nextPreview;
  }

  return preview;
};

export const formatSchemeParamValue = (value: string | string[]): string => (
  Array.isArray(value)
    ? formatSchemeJoinedValuePreview(value, 48)
    : formatSchemeTextPreview(value, 48)
);

export const formatSchemePlaceholderValue = (value: string): string => (
  formatSchemeTextPreview(value, 32)
);

export const formatSchemeSummaryValue = (value: string, maxLength = 56): string => (
  formatSchemeTextPreview(value, maxLength)
);

export const formatSchemeTooltipValue = (value: string, maxLength = 160): string => (
  formatSchemeTextPreview(value, maxLength)
);

export const schemeLayerTypeLabels: Record<DecodeLayer['type'], string> = {
  'url': 'URL',
  'query-string': 'CMD 参数',
  'url-encoded': 'URL Decode',
  'base64': 'Base64',
  'jwt': 'JWT',
  'json': 'JSON 字符串',
  'plain': '纯文本',
  'json-escaped-slash': '斜杠转义',
  'json-unicode-ascii': 'Unicode ASCII',
};

export const schemeParamStageSourceLabels: Record<SchemeParamDecodeStage['source'], string> = {
  query: 'Query',
  hash: 'Hash',
  fragment: 'Fragment',
  'log-field': '日志字段',
  'prefixed-query': '日志参数',
};

export const formatSchemeLayerSizeLabel = (value?: string): string => {
  if (value === undefined) return '未知';
  const stats = getDocumentStats(value);
  return `${stats.characterCount} 字符`;
};

export const getSchemeLayerAfterContent = (
  layers: DecodeLayer[],
  index: number,
  decodedContent: string
): string | undefined => (
  layers[index].after ?? layers[index + 1]?.before ?? (index === layers.length - 1 ? decodedContent : undefined)
);

export const getSchemeLayerReversibleLabel = (layer: DecodeLayer): string => (
  layer.reversible === false ? '只读' : '可回写'
);

export const formatSchemeParamStageValue = (value: string, maxLength = 72): string => (
  formatSchemeTextPreview(value.replace(/\s+/g, ' ').trim(), maxLength)
);

export const formatSchemeParamTooltipValue = (value: string | string[]): string => (
  Array.isArray(value)
    ? formatSchemeJoinedValuePreview(value, 160)
    : formatSchemeTooltipValue(value)
);

export const formatSchemeCopySizeLabel = (content: string): string => {
  const stats = getDocumentStats(content);
  return `${stats.characterCount} 字符 / ${formatByteSize(stats.utf8ByteLength)}`;
};
