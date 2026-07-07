import type {
  PlaceholderTemplateDetail,
} from './placeholderFillTemplateContract';
import {
  readPlaceholderSources,
  readPlaceholderString,
  readPlaceholderSuggestion,
  withOptionalPlaceholderString,
} from './placeholderFillTemplateFieldReaders';
import { isRecord } from './placeholderFillTemplateRecord';

export const parsePlaceholderTemplateDetails = (
  details: unknown,
  placeholders: Record<string, string>
): PlaceholderTemplateDetail[] => {
  if (!Array.isArray(details)) return [];

  return details.flatMap(detail => {
    if (!isRecord(detail)) return [];

    const value = readPlaceholderString(detail, 'value');
    if (!value) return [];

    const suggestion = readPlaceholderSuggestion(detail.suggestion);

    return [{
      value,
      replacement: readPlaceholderString(detail, 'replacement') ?? placeholders[value] ?? '',
      ...withOptionalPlaceholderString(detail, 'description'),
      ...(suggestion ? { suggestion } : {}),
      sources: readPlaceholderSources(detail.sources),
    }];
  });
};
