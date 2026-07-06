import { describe, expect, it, vi } from 'vitest';
import { assertElementLike, clickElement, findByType } from './componentElementTestHelpers';
import { JsonPathPanelResultPreviewLocateButton } from './JsonPathPanelResultPreviewLocateButton';

const locateItem = {
  index: 2,
  locateTitle: '结构定位标题来自 item',
  locateAriaLabel: '结构定位文案来自 item',
};

const renderLocateButton = (
  overrides: Partial<Parameters<typeof JsonPathPanelResultPreviewLocateButton>[0]> = {}
) => JsonPathPanelResultPreviewLocateButton({
  item: locateItem,
  onLocateStructureResult: vi.fn(),
  ...overrides,
});

describe('JsonPathPanelResultPreviewLocateButton', () => {
  it('渲染结构定位按钮属性和隐藏图标', () => {
    const button = assertElementLike(renderLocateButton());

    expect(button.type).toBe('button');
    expect(button.props).toMatchObject({
      type: 'button',
      'data-tour': 'jsonpath-locate-structure',
      title: '结构定位标题来自 item',
      'aria-label': '结构定位文案来自 item',
    });
    expect(findByType(button, 'svg')[0].props['aria-hidden']).toBe('true');
  });

  it('点击时回传结果下标', () => {
    const onLocateStructureResult = vi.fn();
    const button = assertElementLike(renderLocateButton({ onLocateStructureResult }));

    clickElement(button);

    expect(onLocateStructureResult).toHaveBeenCalledWith(2);
  });
});
