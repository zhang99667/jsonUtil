import { describe, expect, it, vi } from 'vitest';
import { assertElementLike, clickElement, collectText, findByTour, findByType } from './componentElementTestHelpers';
import { JsonPathPanelResultPreviewLocateButton } from './JsonPathPanelResultPreviewLocateButton';
import { createJsonPathResultPreviewItem, renderJsonPathPanelResultPreviewRow } from './JsonPathPanelResultPreviewTestFixture';

describe('JsonPathPanelResultPreviewRow', () => {
  it('渲染路径、来源和值，并把点击映射到结果下标', () => {
    const onFocusResult = vi.fn();
    const tree = assertElementLike(renderJsonPathPanelResultPreviewRow({ isActive: true, onFocusResult }));
    const focusButton = findByTour(tree, 'jsonpath-result-preview')[0];

    expect(tree.props.className).toContain('border-emerald-500/40');
    expect(collectText(tree)).toContain('SOURCE');
    expect(collectText(tree)).toContain('$.data.items[0]');
    expect(collectText(tree)).toContain('"value"');
    expect(focusButton.props.title).toBe('预览按钮标题来自 item');
    expect(focusButton.props['aria-label']).toBe('预览按钮文案来自 item');

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
