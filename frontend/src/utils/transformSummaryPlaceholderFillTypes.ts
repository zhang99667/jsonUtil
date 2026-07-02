import type { AppVersionMetadata } from './appVersion';

export interface TransformPlaceholderFillTemplateSource {
  sourcePath: string;
  sourceLabel?: string;
  count: number;
  sourceOriginalPreview?: string;
}

export interface TransformPlaceholderFillTemplateSuggestion {
  replacement: string;
  sourcePath: string;
  sourceLabel?: string;
  reason: string;
}

export interface TransformPlaceholderFillTemplateDetail {
  value: string;
  replacement: string;
  suggestion?: TransformPlaceholderFillTemplateSuggestion;
  description: string;
  count: number;
  sourceCount: number;
  sources: TransformPlaceholderFillTemplateSource[];
}

export interface TransformPlaceholderFillTemplate {
  schemaVersion: 1;
  kind: 'json-helper-runtime-placeholder-fill-template';
  tool: AppVersionMetadata;
  filter: string;
  summary: {
    groups: number;
    visibleOccurrences: number;
    filteredOccurrences: number;
    totalOccurrences: number;
    truncated: boolean;
  };
  placeholders: Record<string, string>;
  placeholderDetails: TransformPlaceholderFillTemplateDetail[];
}
