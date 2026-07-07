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

export const PLACEHOLDER_FILL_TEMPLATE_KIND = 'json-helper-runtime-placeholder-fill-template';

const isRecord = (value: unknown): value is Record<string, unknown> => (
  Boolean(value) && typeof value === 'object' && !Array.isArray(value)
);

const readString = (record: Record<string, unknown>, key: string): string | undefined => (
  typeof record[key] === 'string' ? record[key] : undefined
);

const withOptionalString = (
  record: Record<string, unknown>,
  key: string
): Record<string, string> => {
  const value = readString(record, key);
  return value ? { [key]: value } : {};
};

const readPlaceholderSources = (value: unknown): PlaceholderTemplateSource[] => {
  if (!Array.isArray(value)) return [];

  return value.flatMap(source => {
    if (!isRecord(source)) return [];

    const sourcePath = readString(source, 'sourcePath');
    if (!sourcePath) return [];

    return [{
      sourcePath,
      ...withOptionalString(source, 'sourceLabel'),
      ...withOptionalString(source, 'sourceOriginalPreview'),
    }];
  });
};

const readPlaceholderSuggestion = (value: unknown): PlaceholderTemplateSuggestion | undefined => {
  if (!isRecord(value)) return undefined;

  const replacement = readString(value, 'replacement');
  const sourcePath = readString(value, 'sourcePath');
  if (!replacement || !sourcePath) return undefined;

  return {
    replacement,
    sourcePath,
    ...withOptionalString(value, 'sourceLabel'),
    ...withOptionalString(value, 'reason'),
  };
};

const parsePlaceholderDetails = (
  details: unknown,
  placeholders: Record<string, string>
): PlaceholderTemplateDetail[] => {
  if (!Array.isArray(details)) return [];

  return details.flatMap(detail => {
    if (!isRecord(detail)) return [];

    const value = readString(detail, 'value');
    if (!value) return [];

    const suggestion = readPlaceholderSuggestion(detail.suggestion);

    return [{
      value,
      replacement: readString(detail, 'replacement') ?? placeholders[value] ?? '',
      ...withOptionalString(detail, 'description'),
      ...(suggestion ? { suggestion } : {}),
      sources: readPlaceholderSources(detail.sources),
    }];
  });
};

export const parsePlaceholderTemplateDraft = (templateText: string): PlaceholderTemplateDraft | null => {
  if (!templateText.trim()) return null;

  try {
    const parsed = JSON.parse(templateText) as unknown;
    if (!isRecord(parsed) || parsed.kind !== PLACEHOLDER_FILL_TEMPLATE_KIND) return null;
    if (!isRecord(parsed.placeholders)) return null;

    const placeholders = Object.fromEntries(
      Object.entries(parsed.placeholders).filter((entry): entry is [string, string] => (
        typeof entry[1] === 'string'
      ))
    );
    const detailRows = parsePlaceholderDetails(parsed.placeholderDetails, placeholders);
    const placeholderDetails = detailRows.length > 0
      ? detailRows
      : Object.entries(placeholders).map(([value, replacement]) => ({
        value,
        replacement,
        sources: [],
      }));

    if (placeholderDetails.length === 0) return null;

    return {
      placeholders,
      placeholderDetails,
    };
  } catch {
    return null;
  }
};

export const buildPlaceholderTemplateSummary = (templateText: string): PlaceholderTemplateSummary | null => {
  const draft = parsePlaceholderTemplateDraft(templateText);
  if (!draft) return null;

  const total = draft.placeholderDetails.length;
  const filled = draft.placeholderDetails.filter(detail => detail.replacement.trim().length > 0).length;
  const suggested = draft.placeholderDetails.filter(detail => Boolean(detail.suggestion)).length;

  return {
    total,
    filled,
    suggested,
    pending: Math.max(total - filled, 0),
  };
};

export const updatePlaceholderReplacement = (
  templateText: string,
  placeholderValue: string,
  replacement: string
): string => {
  const parsed = JSON.parse(templateText) as unknown;
  if (!isRecord(parsed) || parsed.kind !== PLACEHOLDER_FILL_TEMPLATE_KIND) return templateText;
  if (!isRecord(parsed.placeholders)) return templateText;

  const placeholders = {
    ...parsed.placeholders,
    [placeholderValue]: replacement,
  };
  const placeholderDetails = Array.isArray(parsed.placeholderDetails)
    ? parsed.placeholderDetails.map(detail => {
      if (!isRecord(detail) || detail.value !== placeholderValue) return detail;
      return {
        ...detail,
        replacement,
      };
    })
    : parsed.placeholderDetails;

  return JSON.stringify({
    ...parsed,
    placeholders,
    ...(Array.isArray(placeholderDetails) ? { placeholderDetails } : {}),
  }, null, 2);
};
