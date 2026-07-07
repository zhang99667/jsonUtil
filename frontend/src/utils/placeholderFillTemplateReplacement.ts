import { PLACEHOLDER_FILL_TEMPLATE_KIND } from './placeholderFillTemplateContract';
import { isRecord } from './placeholderFillTemplateRecord';

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
