import { cleanJsonInput } from './jsonValidation';

export const normalizeSmartSuggestionText = (value: string): string => (
  cleanJsonInput(value).trim()
);
