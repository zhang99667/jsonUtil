import { formatByteSize, getDocumentStats } from './documentStats';

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
