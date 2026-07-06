import type { JsonPathResultPreviewItem } from '../utils/jsonPathPanelPreviewItems';

export const createJsonPathResultPreviewItem = (
  overrides: Partial<JsonPathResultPreviewItem> = {}
): JsonPathResultPreviewItem => ({
  index: 2,
  displayIndex: 3,
  path: '$.data.items[0]',
  sourceLabel: 'SOURCE',
  text: '"value"',
  title: '预览按钮标题来自 item',
  focusAriaLabel: '预览按钮文案来自 item',
  locateTitle: '结构定位标题来自 item',
  locateAriaLabel: '结构定位文案来自 item',
  ...overrides,
});

export const createJsonPathResultPreviewItems = (): JsonPathResultPreviewItem[] => [
  createJsonPathResultPreviewItem({
    index: 0,
    displayIndex: 1,
    path: '$.data[0]',
    text: '"first"',
    title: '聚焦第 1 个结果',
    focusAriaLabel: '聚焦第 1 个结果',
    locateTitle: '定位第 1 个结果',
    locateAriaLabel: '定位第 1 个结果',
  }),
  createJsonPathResultPreviewItem({
    path: '$.data[2]',
    text: '"third"',
    title: '聚焦第 3 个结果',
    focusAriaLabel: '聚焦第 3 个结果',
    locateTitle: '定位第 3 个结果',
    locateAriaLabel: '定位第 3 个结果',
  }),
];
