import type { ValidationResult } from '../types';
import { formatDocumentSize } from './documentStats';
import { formatUnknownError } from './errors';
import { parseJsonValue } from './jsonValueGuards';

export {
  buildPlaceholderTemplateSummary,
  parsePlaceholderTemplateDraft,
  PLACEHOLDER_FILL_TEMPLATE_KIND,
  updatePlaceholderReplacement,
  type PlaceholderTemplateDetail,
  type PlaceholderTemplateDraft,
  type PlaceholderTemplateSource,
  type PlaceholderTemplateSuggestion,
  type PlaceholderTemplateSummary,
} from './templateFillPlaceholderDraftModel';

export const formatTemplateSizeLabel = formatDocumentSize;

export const validateTemplateJson = (content: string): ValidationResult => {
  if (!content.trim()) return { isValid: true };

  try {
    parseJsonValue(content);
    return { isValid: true };
  } catch (error: unknown) {
    return { isValid: false, error: formatUnknownError(error) };
  }
};
