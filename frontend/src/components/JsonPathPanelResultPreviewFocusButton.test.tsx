import { describe, expect, it, vi } from 'vitest';
import { assertElementLike, clickElement, findByType } from './componentElementTestHelpers';
import { createJsonPathResultPreviewItem } from './JsonPathPanelResultPreviewItemTestData';
import { JsonPathPanelResultPreviewFocusButton } from './JsonPathPanelResultPreviewFocusButton';
import { JsonPathPanelResultPreviewRowContent } from './JsonPathPanelResultPreviewRowContent';

const renderFocusButton = (
  overrides: Partial<Parameters<typeof JsonPathPanelResultPreviewFocusButton>[0]> = {}
) => JsonPathPanelResultPreviewFocusButton({
  item: createJsonPathResultPreviewItem(),
  onFocusResult: vi.fn(),
  ...overrides,
});

describe('JsonPathPanelResultPreviewFocusButton', () => {
  it('渲染聚焦按钮属性和结果内容', () => {
    const previewItem = createJsonPathResultPreviewItem();
    const button = assertElementLike(renderFocusButton({ item: previewItem }));

    expect(button.type).toBe('button');
    expect(button.props).toMatchObject({
      type: 'button',
      'data-tour': 'jsonpath-result-preview',
      title: '预览按钮标题来自 item',
      'aria-label': '预览按钮文案来自 item',
    });
    expect(findByType(button, JsonPathPanelResultPreviewRowContent)[0].props.item).toBe(previewItem);
  });

  it('点击时回传结果下标', () => {
    const onFocusResult = vi.fn();
    const button = assertElementLike(renderFocusButton({ onFocusResult }));

    clickElement(button);

    expect(onFocusResult).toHaveBeenCalledWith(2);
  });
});
