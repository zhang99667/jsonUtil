import type { JsonPathQueryItem } from './jsonPathQuery';
import { formatJsonPathValueForCompactPreview } from './jsonPathPreview';

export interface JsonPathResultPreviewItem {
  index: number;
  path: string;
  sourceLabel?: string;
  text: string;
}

export const buildJsonPathResultPreviewItems = (
  items: JsonPathQueryItem[],
  maxVisibleItems: number
): JsonPathResultPreviewItem[] => (
  items.slice(0, maxVisibleItems).map((item, index) => ({
    index,
    path: item.path,
    sourceLabel: item.sourceLabel,
    text: formatJsonPathValueForCompactPreview(item.value),
  }))
);
