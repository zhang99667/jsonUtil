import { describe, expect, it, vi } from 'vitest';
import { clickElement, findByTour, findByType } from './componentElementTestHelpers';
import { JsonPathPanelQueryActionButtons } from './JsonPathPanelQueryActionButtons';
import { JsonPathPanelQueryRunButton } from './JsonPathPanelQueryRunButton';

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
  it('装配查询运行按钮并透传状态和说明属性', () => {
    const onRunQuery = vi.fn();
    const tree = renderActions({ isDataPreparing: true, onRunQuery });
    const runButton = findByType(tree, JsonPathPanelQueryRunButton)[0];

    expect(runButton.props).toMatchObject({
      isQuerying: false,
      isDataPreparing: true,
      title: '执行 JSONPath 查询',
      descriptionId: 'jsonpath-query-desc',
      onRunQuery,
    });
    expect(findByTour(tree, 'jsonpath-cancel-query')).toHaveLength(0);
  });

  it('查询中禁用查询按钮并显示取消按钮', () => {
    const onCancelQuery = vi.fn();
    const tree = renderActions({ isQuerying: true, onCancelQuery });
    const runButton = findByType(tree, JsonPathPanelQueryRunButton)[0];
    const cancelButton = findByTour(tree, 'jsonpath-cancel-query')[0];

    expect(runButton.props.isQuerying).toBe(true);
    expect(cancelButton.props.title).toBe('停止当前 JSONPath 查询');
    expect(cancelButton.props['aria-label']).toBe('取消 JSONPath 查询，停止当前正在执行的查询');

    clickElement(cancelButton);
    expect(onCancelQuery).toHaveBeenCalledTimes(1);
  });

  it('数据准备中禁用查询按钮但不展示取消按钮', () => {
    const tree = renderActions({ isDataPreparing: true });

    expect(findByType(tree, JsonPathPanelQueryRunButton)[0].props.isDataPreparing).toBe(true);
    expect(findByTour(tree, 'jsonpath-cancel-query')).toHaveLength(0);
  });
});
