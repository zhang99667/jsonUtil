import { describe, expect, it, vi } from 'vitest';
import { assertElementLike, clickElement, findByTour, findByType } from './componentElementTestHelpers';
import { JsonPathPanelResultPreviewLocateButton } from './JsonPathPanelResultPreviewLocateButton';
import { createJsonPathResultPreviewItem } from './JsonPathPanelResultPreviewItemTestData';
import { JsonPathPanelResultPreviewRowContent } from './JsonPathPanelResultPreviewRowContent';
import { renderJsonPathPanelResultPreviewRow } from './JsonPathPanelResultPreviewTestFixture';

describe('JsonPathPanelResultPreviewRow', () => {
  it('渲染聚焦按钮状态，并把点击映射到结果下标', () => {
    const onFocusResult = vi.fn();
    const previewItem = createJsonPathResultPreviewItem();
    const tree = assertElementLike(renderJsonPathPanelResultPreviewRow({ item: previewItem, isActive: true, onFocusResult }));
    const focusButton = findByTour(tree, 'jsonpath-result-preview')[0];

    expect(tree.props.className).toContain('border-emerald-500/40');
    expect(focusButton.props.title).toBe('预览按钮标题来自 item');
    expect(focusButton.props['aria-label']).toBe('预览按钮文案来自 item');
    expect(findByType(tree, JsonPathPanelResultPreviewRowContent)[0].props.item).toBe(previewItem);

    clickElement(focusButton);
    expect(onFocusResult).toHaveBeenCalledWith(2);
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
