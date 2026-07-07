import {
  PLACEHOLDER_FILL_TEMPLATE_KIND,
  type PlaceholderTemplateDetail,
  type PlaceholderTemplateDraft,
  type PlaceholderTemplateSummary,
} from './placeholderFillTemplateContract';
import { parsePlaceholderTemplateDetails } from './placeholderFillTemplateDraftReaders';
import { isRecord } from './placeholderFillTemplateRecord';

export {
  PLACEHOLDER_FILL_TEMPLATE_KIND,
  type PlaceholderTemplateDetail,
  type PlaceholderTemplateDraft,
  type PlaceholderTemplateSource,
  type PlaceholderTemplateSuggestion,
  type PlaceholderTemplateSummary,
} from './placeholderFillTemplateContract';
export { updatePlaceholderReplacement } from './placeholderFillTemplateReplacement';

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
    const detailRows = parsePlaceholderTemplateDetails(parsed.placeholderDetails, placeholders);
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
