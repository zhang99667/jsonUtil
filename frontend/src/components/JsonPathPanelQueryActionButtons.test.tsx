import { describe, expect, it, vi } from 'vitest';
import { JsonPathPanelQueryActionButtons } from './JsonPathPanelQueryActionButtons';
import { JsonPathPanelQueryCancelButton } from './JsonPathPanelQueryCancelButton';
import { JsonPathPanelQueryRunButton } from './JsonPathPanelQueryRunButton';
import { findByTour, findByType } from './componentElementTestHelpers';

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
    expect(findByType(tree, JsonPathPanelQueryCancelButton)).toHaveLength(0);
  });

  it('查询中禁用查询按钮并显示取消按钮', () => {
    const onCancelQuery = vi.fn();
    const tree = renderActions({ isQuerying: true, onCancelQuery });
    const runButton = findByType(tree, JsonPathPanelQueryRunButton)[0];
    const cancelButton = findByType(tree, JsonPathPanelQueryCancelButton)[0];

    expect(runButton.props.isQuerying).toBe(true);
    expect(cancelButton.props.onCancelQuery).toBe(onCancelQuery);
  });

  it('数据准备中禁用查询按钮但不展示取消按钮', () => {
    const tree = renderActions({ isDataPreparing: true });

    expect(findByType(tree, JsonPathPanelQueryRunButton)[0].props.isDataPreparing).toBe(true);
    expect(findByTour(tree, 'jsonpath-cancel-query')).toHaveLength(0);
  });
});
