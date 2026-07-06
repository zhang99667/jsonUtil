import { vi } from 'vitest';
import { JsonPathPanelResultPreview } from './JsonPathPanelResultPreview';
import { JsonPathPanelResultPreviewList } from './JsonPathPanelResultPreviewList';
import { JsonPathPanelResultPreviewRow } from './JsonPathPanelResultPreviewRow';
import { createJsonPathResultPreviewItem, createJsonPathResultPreviewItems } from './JsonPathPanelResultPreviewItemTestData';

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
