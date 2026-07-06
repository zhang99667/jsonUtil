import { cleanJsonInput } from './jsonValidation';

export const normalizeSmartSuggestionText = (value: string): string => (
  cleanJsonInput(value).trim()
);

export const shouldKeepSmartSuggestionOrigin = (
  sourceText: string,
  hasSmartSuggestion: boolean,
  smartSuggestionOriginText: string
): boolean => (
  hasSmartSuggestion && normalizeSmartSuggestionText(sourceText) === smartSuggestionOriginText
);
