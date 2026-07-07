import type {
  PlaceholderTemplateSource,
  PlaceholderTemplateSuggestion,
} from './placeholderFillTemplateContract';
import { isRecord } from './placeholderFillTemplateRecord';

export const readPlaceholderString = (
  record: Record<string, unknown>,
  key: string
): string | undefined => (
  typeof record[key] === 'string' ? record[key] : undefined
);

export const withOptionalPlaceholderString = (
  record: Record<string, unknown>,
  key: string
): Record<string, string> => {
  const value = readPlaceholderString(record, key);
  return value ? { [key]: value } : {};
};

export const readPlaceholderSources = (value: unknown): PlaceholderTemplateSource[] => {
  if (!Array.isArray(value)) return [];

  return value.flatMap(source => {
    if (!isRecord(source)) return [];

    const sourcePath = readPlaceholderString(source, 'sourcePath');
    if (!sourcePath) return [];

    return [{
      sourcePath,
      ...withOptionalPlaceholderString(source, 'sourceLabel'),
      ...withOptionalPlaceholderString(source, 'sourceOriginalPreview'),
    }];
  });
};

export const readPlaceholderSuggestion = (value: unknown): PlaceholderTemplateSuggestion | undefined => {
  if (!isRecord(value)) return undefined;

  const replacement = readPlaceholderString(value, 'replacement');
  const sourcePath = readPlaceholderString(value, 'sourcePath');
  if (!replacement || !sourcePath) return undefined;

  return {
    replacement,
    sourcePath,
    ...withOptionalPlaceholderString(value, 'sourceLabel'),
    ...withOptionalPlaceholderString(value, 'reason'),
  };
};
