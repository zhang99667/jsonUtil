import { describe, expect, it } from 'vitest';
import { buildJsonPathPanelUiState, type JsonPathPanelUiStateInput } from './jsonPathPanelUiState';

const buildInput = (overrides: Partial<JsonPathPanelUiStateInput> = {}): JsonPathPanelUiStateInput => ({
  normalizedQuery: '$.items',
  isCurrentQueryFavorite: false,
  isResultLimited: false,
  emptyResultQuery: '',
  cancelledQuery: '',
  error: '',
  isQuerying: false,
  totalResults: 0,
  navigableResultCount: 0,
  isDataPreparing: false,
  hasJsonData: true,
  queryItemsCount: 3,
  previewItemsCount: 2,
  errorMessageId: 'jsonpath-error',
  resultStatusId: 'jsonpath-status',
  ...overrides,
});

describe('jsonPathPanelUiState', () => {
  it('组合结果状态、收藏标题和查询按钮标题', () => {
    const uiState = buildJsonPathPanelUiState(buildInput());

    expect(uiState).toMatchObject({
      hiddenResultCount: 1,
      copyButtonLabel: '复制全部结果',
      copyPathValueButtonLabel: '复制路径和值',
      favoriteToggleTitle: '收藏当前查询',
      queryButtonTitle: '执行 JSONPath 查询',
    });
  });

  it('组合输入描述 ID', () => {
    expect(buildJsonPathPanelUiState(buildInput({
      totalResults: 3,
      navigableResultCount: 3,
    })).queryInputDescriptionId).toBe('jsonpath-status');
  });
});
