import type { ValidationResult } from '../types';
import { formatByteSize, getDocumentStats } from './documentStats';
import { formatUnknownError } from './errors';

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

export const formatTemplateSizeLabel = (content: string): string => {
  const stats = getDocumentStats(content);
  return `${stats.characterCount} 字符 / ${formatByteSize(stats.utf8ByteLength)}`;
};

export const validateTemplateJson = (content: string): ValidationResult => {
  if (!content.trim()) return { isValid: true };

  try {
    JSON.parse(content);
    return { isValid: true };
  } catch (error: unknown) {
    return { isValid: false, error: formatUnknownError(error) };
  }
};
