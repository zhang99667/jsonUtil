import { describe, expect, it, vi } from 'vitest';
import { findByType } from './componentElementTestHelpers';
import { JsonPathPanelResultPreviewList } from './JsonPathPanelResultPreviewList';
import { JsonPathPanelResultPreviewRow } from './JsonPathPanelResultPreviewRow';

const previewItems = [
  {
    index: 0,
    displayIndex: 1,
    path: '$.data[0]',
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
    sourceLabel: 'SOURCE',
    text: '"third"',
    title: '聚焦第 3 个结果',
    focusAriaLabel: '聚焦第 3 个结果',
    locateTitle: '定位第 3 个结果',
    locateAriaLabel: '定位第 3 个结果',
  },
];

const renderList = (
  overrides: Partial<Parameters<typeof JsonPathPanelResultPreviewList>[0]> = {}
) => JsonPathPanelResultPreviewList({
  previewItems,
  currentResultIndex: 2,
  showLocateStructure: true,
  onFocusResult: vi.fn(),
  onLocateStructureResult: vi.fn(),
  ...overrides,
});

describe('JsonPathPanelResultPreviewList', () => {
  it('装配结果行、选中态和交互回调', () => {
    const onFocusResult = vi.fn();
    const onLocateStructureResult = vi.fn();
    const rows = findByType(renderList({ onFocusResult, onLocateStructureResult }), JsonPathPanelResultPreviewRow);

    expect(rows.map(row => row.props.item)).toEqual(previewItems);
    expect(rows.map(row => row.props.isActive)).toEqual([false, true]);
    expect(rows.map(row => row.props.showLocateStructure)).toEqual([true, true]);
    expect(rows[0].props.onFocusResult).toBe(onFocusResult);
    expect(rows[0].props.onLocateStructureResult).toBe(onLocateStructureResult);
  });
});
