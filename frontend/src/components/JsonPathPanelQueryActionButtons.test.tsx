import { describe, expect, it, vi } from 'vitest';
import { clickElement, collectText, findByTour, findByType } from './componentElementTestHelpers';
import { JsonPathPanelQueryActionButtons } from './JsonPathPanelQueryActionButtons';

const renderActions = (
  overrides: Partial<Parameters<typeof JsonPathPanelQueryActionButtons>[0]> = {}
) => JsonPathPanelQueryActionButtons({
  isQuerying: false,
  isDataPreparing: false,
  queryButtonTitle: '执行 JSONPath 查询',
  queryButtonDescriptionId: 'jsonpath-query-desc',
  onRunQuery: vi.fn(),
  onCancelQuery: vi.fn(),
  ...overrides,
});

describe('JsonPathPanelQueryActionButtons', () => {
  it('空闲时只渲染可点击查询按钮和隐藏说明', () => {
    const onRunQuery = vi.fn();
    const tree = renderActions({ onRunQuery });
    const queryButton = findByTour(tree, 'jsonpath-query-button')[0];
    const description = findByType(tree, 'span')[0];

    expect(queryButton.props.disabled).toBe(false);
    expect(queryButton.props.title).toBe('执行 JSONPath 查询');
    expect(queryButton.props['aria-describedby']).toBe('jsonpath-query-desc');
    expect(collectText(queryButton)).toBe('查询');
    expect(description.props).toMatchObject({ id: 'jsonpath-query-desc', className: 'sr-only' });
    expect(collectText(description)).toBe('执行 JSONPath 查询');
    expect(findByTour(tree, 'jsonpath-cancel-query')).toHaveLength(0);

    clickElement(queryButton);
    expect(onRunQuery).toHaveBeenCalledTimes(1);
  });

  it('查询中禁用查询按钮并显示取消按钮', () => {
    const onCancelQuery = vi.fn();
    const tree = renderActions({ isQuerying: true, onCancelQuery });
    const queryButton = findByTour(tree, 'jsonpath-query-button')[0];
    const cancelButton = findByTour(tree, 'jsonpath-cancel-query')[0];

    expect(queryButton.props.disabled).toBe(true);
    expect(collectText(queryButton)).toBe('查询中...');
    expect(cancelButton.props.title).toBe('停止当前 JSONPath 查询');
    expect(cancelButton.props['aria-label']).toBe('取消 JSONPath 查询，停止当前正在执行的查询');

    clickElement(cancelButton);
    expect(onCancelQuery).toHaveBeenCalledTimes(1);
  });

  it('数据准备中禁用查询按钮但不展示取消按钮', () => {
    const tree = renderActions({ isDataPreparing: true });

    expect(findByTour(tree, 'jsonpath-query-button')[0].props.disabled).toBe(true);
    expect(findByTour(tree, 'jsonpath-cancel-query')).toHaveLength(0);
  });
});
