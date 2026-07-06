import { describe, expect, it, vi } from 'vitest';
import { clickElement, collectText, findByTour, findByType } from './componentElementTestHelpers';
import { JsonPathPanelQueryRunButton } from './JsonPathPanelQueryRunButton';

const renderRunButton = (
  overrides: Partial<Parameters<typeof JsonPathPanelQueryRunButton>[0]> = {}
) => JsonPathPanelQueryRunButton({
  isQuerying: false,
  isDataPreparing: false,
  title: '执行 JSONPath 查询',
  descriptionId: 'jsonpath-query-desc',
  onRunQuery: vi.fn(),
  ...overrides,
});

describe('JsonPathPanelQueryRunButton', () => {
  it('渲染查询按钮属性、隐藏说明并接通点击回调', () => {
    const onRunQuery = vi.fn();
    const tree = renderRunButton({ onRunQuery });
    const queryButton = findByTour(tree, 'jsonpath-query-button')[0];
    const description = findByType(tree, 'span')[0];

    expect(queryButton.props).toMatchObject({
      disabled: false,
      title: '执行 JSONPath 查询',
      'aria-describedby': 'jsonpath-query-desc',
    });
    expect(collectText(queryButton)).toBe('查询');
    expect(description.props).toMatchObject({ id: 'jsonpath-query-desc', className: 'sr-only' });
    expect(collectText(description)).toBe('执行 JSONPath 查询');

    clickElement(queryButton);
    expect(onRunQuery).toHaveBeenCalledTimes(1);
    if (typeof queryButton.props.onClick !== 'function') throw new Error('expected clickable query button');
    queryButton.props.onClick('synthetic-click-event');
    expect(onRunQuery).toHaveBeenLastCalledWith();
  });

  it('查询中和数据准备中都会禁用运行按钮', () => {
    expect(findByTour(renderRunButton({ isQuerying: true }), 'jsonpath-query-button')[0].props.disabled).toBe(true);
    expect(collectText(findByTour(renderRunButton({ isQuerying: true }), 'jsonpath-query-button')[0])).toBe('查询中...');
    expect(findByTour(renderRunButton({ isDataPreparing: true }), 'jsonpath-query-button')[0].props.disabled).toBe(true);
  });
});
