import { describe, expect, it, vi } from 'vitest';
import { findByType } from './componentElementTestHelpers';
import { JsonPathPanelFavoriteToggleButton } from './JsonPathPanelFavoriteToggleButton';
import { JsonPathPanelQueryActionButtons } from './JsonPathPanelQueryActionButtons';
import { JsonPathPanelQueryInput } from './JsonPathPanelQueryInput';
import { JsonPathPanelQueryInputField } from './JsonPathPanelQueryInputField';
import { JsonPathPanelQueryStatus } from './JsonPathPanelQueryStatus';

const renderQueryInput = (
  overrides: Partial<Parameters<typeof JsonPathPanelQueryInput>[0]> = {}
) => JsonPathPanelQueryInput({
  query: '$.store',
  normalizedQuery: '$.store',
  isCurrentQueryFavorite: false,
  isQuerying: false,
  isDataPreparing: false,
  error: '',
  uiState: {
    queryInputDescriptionId: 'jsonpath-query-desc',
    favoriteToggleTitle: '收藏当前查询',
    queryButtonTitle: '执行 JSONPath 查询',
    showCancelledQuery: false,
  },
  queryButtonDescriptionId: 'jsonpath-query-button-desc',
  inputRef: vi.fn(),
  onQueryChange: vi.fn(),
  onKeyDown: vi.fn(),
  onToggleFavorite: vi.fn(),
  onRunQuery: vi.fn(),
  onCancelQuery: vi.fn(),
  ...overrides,
});

describe('JsonPathPanelQueryInput', () => {
  it('只负责装配输入框、收藏按钮、查询按钮和状态提示', () => {
    const tree = renderQueryInput({
      normalizedQuery: '',
      isCurrentQueryFavorite: true,
      isQuerying: true,
      isDataPreparing: true,
      error: 'JSONPath 语法错误',
      uiState: {
        queryInputDescriptionId: 'jsonpath-query-desc',
        favoriteToggleTitle: '取消收藏当前查询',
        queryButtonTitle: '查询准备中',
        showCancelledQuery: true,
      },
    });
    const input = findByType(tree, JsonPathPanelQueryInputField)[0];
    const favorite = findByType(tree, JsonPathPanelFavoriteToggleButton)[0];
    const actions = findByType(tree, JsonPathPanelQueryActionButtons)[0];
    const status = findByType(tree, JsonPathPanelQueryStatus)[0];

    expect(input.props).toMatchObject({
      query: '$.store',
      error: 'JSONPath 语法错误',
      descriptionId: 'jsonpath-query-desc',
    });
    expect(favorite.props).toMatchObject({
      isFavorite: true,
      disabled: true,
      title: '取消收藏当前查询',
    });
    expect(actions.props).toMatchObject({
      isQuerying: true,
      isDataPreparing: true,
      queryButtonTitle: '查询准备中',
      queryButtonDescriptionId: 'jsonpath-query-button-desc',
    });
    expect(status.props).toMatchObject({
      isQuerying: true,
      showCancelledQuery: true,
    });
  });
});
