import { describe, expect, it, vi } from 'vitest';
import { clickElement, collectText, findByTour } from './componentElementTestHelpers';
import { JsonPathPanelQueryCancelButton } from './JsonPathPanelQueryCancelButton';

const renderCancelButton = (
  overrides: Partial<Parameters<typeof JsonPathPanelQueryCancelButton>[0]> = {}
) => JsonPathPanelQueryCancelButton({
  onCancelQuery: vi.fn(),
  ...overrides,
});

describe('JsonPathPanelQueryCancelButton', () => {
  it('渲染取消按钮属性并接通点击回调', () => {
    const onCancelQuery = vi.fn();
    const tree = renderCancelButton({ onCancelQuery });
    const cancelButton = findByTour(tree, 'jsonpath-cancel-query')[0];

    expect(cancelButton.props).toMatchObject({
      title: '停止当前 JSONPath 查询',
      'aria-label': '取消 JSONPath 查询，停止当前正在执行的查询',
    });
    expect(collectText(cancelButton)).toBe('取消');

    clickElement(cancelButton);
    expect(onCancelQuery).toHaveBeenCalledTimes(1);
  });
});
