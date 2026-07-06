import { describe, expect, it, vi } from 'vitest';
import { assertElementLike, clickElement, collectText, findByTour, findByType } from './componentElementTestHelpers';
import { JsonPathPanelResultPreviewRow } from './JsonPathPanelResultPreviewRow';

const previewItem = {
  index: 2,
  path: '$.data.items[0]',
  sourceLabel: 'SOURCE',
  text: '"value"',
};

const renderRow = (
  overrides: Partial<Parameters<typeof JsonPathPanelResultPreviewRow>[0]> = {}
) => JsonPathPanelResultPreviewRow({
  item: previewItem,
  isActive: false,
  showLocateStructure: true,
  onFocusResult: vi.fn(),
  onLocateStructureResult: vi.fn(),
  ...overrides,
});

describe('JsonPathPanelResultPreviewRow', () => {
  it('渲染路径、来源和值，并把点击映射到结果下标', () => {
    const onFocusResult = vi.fn();
    const tree = assertElementLike(renderRow({ isActive: true, onFocusResult }));
    const focusButton = findByTour(tree, 'jsonpath-result-preview')[0];

    expect(tree.props.className).toContain('border-emerald-500/40');
    expect(collectText(tree)).toContain('SOURCE');
    expect(collectText(tree)).toContain('$.data.items[0]');
    expect(collectText(tree)).toContain('"value"');
    expect(focusButton.props.title).toBe('SOURCE $.data.items[0]\n"value"');
    expect(focusButton.props['aria-label']).toBe('定位第 3 个 JSONPath 结果：$.data.items[0]');

    clickElement(focusButton);
    expect(onFocusResult).toHaveBeenCalledWith(2);
  });

  it('按需展示结构定位入口', () => {
    const onLocateStructureResult = vi.fn();
    const tree = renderRow({ showLocateStructure: true, onLocateStructureResult });
    const locateButton = findByTour(tree, 'jsonpath-locate-structure')[0];

    clickElement(locateButton);
    expect(onLocateStructureResult).toHaveBeenCalledWith(2);
    expect(findByType(locateButton, 'svg')[0].props['aria-hidden']).toBe('true');

    expect(findByTour(renderRow({ showLocateStructure: false }), 'jsonpath-locate-structure')).toHaveLength(0);
  });
});
