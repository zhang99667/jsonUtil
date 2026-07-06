import type { JsonPathQueryItem } from './jsonPathQuery';
import { formatJsonPathValueForCompactPreview } from './jsonPathPreview';

export interface JsonPathResultPreviewItem {
  index: number;
  displayIndex: number;
  path: string;
  sourceLabel?: string;
  text: string;
  title: string;
  focusAriaLabel: string;
  locateTitle: string;
  locateAriaLabel: string;
}

export const buildJsonPathResultPreviewItems = (
  items: JsonPathQueryItem[],
  maxVisibleItems: number
): JsonPathResultPreviewItem[] => (
  items.slice(0, maxVisibleItems).map((item, index) => {
    const text = formatJsonPathValueForCompactPreview(item.value);
    const displayIndex = index + 1;

    return {
      index,
      displayIndex,
      path: item.path,
      sourceLabel: item.sourceLabel,
      text,
      title: `${item.sourceLabel ? `${item.sourceLabel} ` : ''}${item.path}\n${text}`,
      focusAriaLabel: `定位第 ${displayIndex} 个 JSONPath 结果：${item.path}`,
      locateTitle: `在结构导航中定位 ${item.path}`,
      locateAriaLabel: `在结构导航中定位第 ${displayIndex} 个 JSONPath 结果：${item.path}`,
    };
  })
);
