import type {
  PlaceholderTemplateDetail,
  PlaceholderTemplateSource,
  PlaceholderTemplateSuggestion,
} from './placeholderFillTemplateContract';
import { isRecord } from './placeholderFillTemplateRecord';

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

export const parsePlaceholderTemplateDetails = (
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
