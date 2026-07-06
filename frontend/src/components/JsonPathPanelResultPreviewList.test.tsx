import { describe, expect, it, vi } from 'vitest';
import { findByType } from './componentElementTestHelpers';
import { JsonPathPanelResultPreviewRow } from './JsonPathPanelResultPreviewRow';
import { createJsonPathResultPreviewItems, renderJsonPathPanelResultPreviewList } from './JsonPathPanelResultPreviewTestFixture';

describe('JsonPathPanelResultPreviewList', () => {
  it('装配结果行、选中态和交互回调', () => {
    const onFocusResult = vi.fn();
    const onLocateStructureResult = vi.fn();
    const previewItems = createJsonPathResultPreviewItems();
    const rows = findByType(
      renderJsonPathPanelResultPreviewList({ onFocusResult, onLocateStructureResult, previewItems }),
      JsonPathPanelResultPreviewRow
    );

    expect(rows.map(row => row.props.item)).toEqual(previewItems);
    expect(rows.map(row => row.props.isActive)).toEqual([false, true]);
    expect(rows.map(row => row.props.showLocateStructure)).toEqual([true, true]);
    expect(rows[0].props.onFocusResult).toBe(onFocusResult);
    expect(rows[0].props.onLocateStructureResult).toBe(onLocateStructureResult);
  });
});
