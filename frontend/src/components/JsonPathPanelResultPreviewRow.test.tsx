import { describe, expect, it, vi } from 'vitest';
import { assertElementLike, findByType } from './componentElementTestHelpers';
import { JsonPathPanelResultPreviewFocusButton } from './JsonPathPanelResultPreviewFocusButton';
import { JsonPathPanelResultPreviewLocateButton } from './JsonPathPanelResultPreviewLocateButton';
import { createJsonPathResultPreviewItem } from './JsonPathPanelResultPreviewItemTestData';
import { renderJsonPathPanelResultPreviewRow } from './JsonPathPanelResultPreviewTestFixture';

describe('JsonPathPanelResultPreviewRow', () => {
  it('渲染聚焦按钮状态，并把点击映射到结果下标', () => {
    const onFocusResult = vi.fn();
    const previewItem = createJsonPathResultPreviewItem();
    const tree = assertElementLike(renderJsonPathPanelResultPreviewRow({ item: previewItem, isActive: true, onFocusResult }));
    const focusButton = findByType(tree, JsonPathPanelResultPreviewFocusButton)[0];

    expect(tree.props.className).toContain('border-emerald-500/40');
    expect(focusButton.props.item).toBe(previewItem);
    expect(focusButton.props.onFocusResult).toBe(onFocusResult);
  });

  it('按需展示结构定位入口', () => {
    const onLocateStructureResult = vi.fn();
    const previewItem = createJsonPathResultPreviewItem();
    const tree = renderJsonPathPanelResultPreviewRow({ item: previewItem, showLocateStructure: true, onLocateStructureResult });
    const locateButton = findByType(tree, JsonPathPanelResultPreviewLocateButton)[0];

    expect(locateButton.props.item).toBe(previewItem);
    expect(locateButton.props.onLocateStructureResult).toBe(onLocateStructureResult);
    expect(findByType(renderJsonPathPanelResultPreviewRow({ showLocateStructure: false }), JsonPathPanelResultPreviewLocateButton)).toHaveLength(0);
  });
});
