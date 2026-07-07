export const PLACEHOLDER_FILL_TEMPLATE_KIND = 'json-helper-runtime-placeholder-fill-template';

export type PlaceholderFillTemplateKind = typeof PLACEHOLDER_FILL_TEMPLATE_KIND;

export interface PlaceholderTemplateSummary {
  total: number;
  filled: number;
  suggested: number;
  pending: number;
}

export interface PlaceholderTemplateSource {
  sourcePath: string;
  sourceLabel?: string;
  sourceOriginalPreview?: string;
}

export interface PlaceholderTemplateSuggestion {
  replacement: string;
  sourcePath: string;
  sourceLabel?: string;
  reason?: string;
}

export interface PlaceholderTemplateDetail {
  value: string;
  replacement: string;
  description?: string;
  suggestion?: PlaceholderTemplateSuggestion;
  sources: PlaceholderTemplateSource[];
}

export interface PlaceholderTemplateDraft {
  placeholders: Record<string, string>;
  placeholderDetails: PlaceholderTemplateDetail[];
}
