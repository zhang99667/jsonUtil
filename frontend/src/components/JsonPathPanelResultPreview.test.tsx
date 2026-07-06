import { describe, expect, it, vi } from 'vitest';
import { assertElementLike, findByTour, findByType } from './componentElementTestHelpers';
import { JsonPathPanelResultPreview } from './JsonPathPanelResultPreview';
import { JsonPathPanelResultPreviewMessages } from './JsonPathPanelResultPreviewMessages';
import { JsonPathPanelResultPreviewRow } from './JsonPathPanelResultPreviewRow';

const previewItems = [
  {
    index: 0,
    displayIndex: 1,
    path: '$.data[0]',
    sourceLabel: 'SOURCE',
    text: '"first"',
    title: '聚焦第 1 个结果',
    focusAriaLabel: '聚焦第 1 个结果',
    locateTitle: '定位第 1 个结果',
    locateAriaLabel: '定位第 1 个结果',
  },
  {
    index: 2,
    displayIndex: 3,
    path: '$.data[2]',
    sourceLabel: '',
    text: '"third"',
    title: '聚焦第 3 个结果',
    focusAriaLabel: '聚焦第 3 个结果',
    locateTitle: '定位第 3 个结果',
    locateAriaLabel: '定位第 3 个结果',
  },
];

const renderPreview = (
  overrides: Partial<Parameters<typeof JsonPathPanelResultPreview>[0]> = {}
) => JsonPathPanelResultPreview({
  previewItems,
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

describe('JsonPathPanelResultPreview', () => {
  it('无预览项时不渲染容器', () => {
    expect(renderPreview({ previewItems: [] })).toBeNull();
  });

  it('装配结果行和预览提示状态', () => {
    const onWheel = vi.fn();
    const tree = assertElementLike(renderPreview({ onWheel }));
    const rows = findByType(tree, JsonPathPanelResultPreviewRow);
    const messages = findByType(tree, JsonPathPanelResultPreviewMessages)[0];

    expect(findByTour(tree, 'jsonpath-results')[0].props.onWheel).toBe(onWheel);
    expect(rows.map(row => row.props.isActive)).toEqual([false, true]);
    expect(rows.map(row => row.props.item)).toEqual(previewItems);
    expect(messages.props).toMatchObject({
      hiddenResultCount: 4,
      maxVisibleResultCount: 5,
      copiedResultCount: 9,
      isResultLimited: true,
      resultLimit: 500,
    });
  });
});
