import { vi } from 'vitest';
import type { JsonPathResultPreviewItem } from '../utils/jsonPathPanelPreviewItems';
import { JsonPathPanelResultPreview } from './JsonPathPanelResultPreview';
import { JsonPathPanelResultPreviewList } from './JsonPathPanelResultPreviewList';
import { JsonPathPanelResultPreviewRow } from './JsonPathPanelResultPreviewRow';

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

export const renderJsonPathPanelResultPreview = (
  overrides: Partial<Parameters<typeof JsonPathPanelResultPreview>[0]> = {}
) => JsonPathPanelResultPreview({
  previewItems: createJsonPathResultPreviewItems(),
  currentResultIndex: 2,
  hiddenResultCount: 4,
  maxVisibleResultCount: 5,
  copiedResultCount: 9,
  isResultLimited: true,
  resultLimit: 500,
  showLocateStructure: true,
  onWheel: vi.fn(),
  onFocusResult: vi.fn(),
  onLocateStructureResult: vi.fn(),
  ...overrides,
});

export const renderJsonPathPanelResultPreviewList = (
  overrides: Partial<Parameters<typeof JsonPathPanelResultPreviewList>[0]> = {}
) => JsonPathPanelResultPreviewList({
  previewItems: createJsonPathResultPreviewItems(),
  currentResultIndex: 2,
  showLocateStructure: true,
  onFocusResult: vi.fn(),
  onLocateStructureResult: vi.fn(),
  ...overrides,
});

export const renderJsonPathPanelResultPreviewRow = (
  overrides: Partial<Parameters<typeof JsonPathPanelResultPreviewRow>[0]> = {}
) => JsonPathPanelResultPreviewRow({
  item: createJsonPathResultPreviewItem(),
  isActive: false,
  showLocateStructure: true,
  onFocusResult: vi.fn(),
  onLocateStructureResult: vi.fn(),
  ...overrides,
});
