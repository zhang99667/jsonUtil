import { describe, expect, it, vi } from 'vitest';
import { findByType } from './componentElementTestHelpers';
import { JsonPathPanelQueryInput } from './JsonPathPanelQueryInput';
import { JsonPathPanelQueryInputControls } from './JsonPathPanelQueryInputControls';
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
  it('只负责装配控件行和状态提示', () => {
    const activeUiState = {
      queryInputDescriptionId: 'jsonpath-query-desc',
      favoriteToggleTitle: '取消收藏当前查询',
      queryButtonTitle: '查询准备中',
      showCancelledQuery: true,
    };
    const tree = renderQueryInput({
      normalizedQuery: '',
      isQuerying: true,
      uiState: activeUiState,
    });
    const controls = findByType(tree, JsonPathPanelQueryInputControls)[0];
    const status = findByType(tree, JsonPathPanelQueryStatus)[0];

    expect(controls.props).toMatchObject({
      query: '$.store',
      normalizedQuery: '',
      isQuerying: true,
      queryButtonDescriptionId: 'jsonpath-query-button-desc',
    });
    expect(controls.props.uiState).toBe(activeUiState);
    expect(status.props).toMatchObject({
      isQuerying: true,
      showCancelledQuery: true,
    });
  });
});
