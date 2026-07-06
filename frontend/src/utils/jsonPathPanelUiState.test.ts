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
  it('组合默认复制文案和隐藏结果数量', () => {
    expect(buildJsonPathPanelUiState(buildInput())).toMatchObject({
      hiddenResultCount: 1,
      copyButtonLabel: '复制全部结果',
      copyPathValueButtonLabel: '复制路径和值',
      favoriteToggleTitle: '收藏当前查询',
      queryButtonTitle: '执行 JSONPath 查询',
    });
  });

  it('命中上限时提示复制已返回结果', () => {
    expect(buildJsonPathPanelUiState(buildInput({ isResultLimited: true }))).toMatchObject({
      copyButtonLabel: '复制已返回结果',
      copyPathValueButtonLabel: '复制已返回路径和值',
    });
  });

  it('区分空查询、已收藏和取消查询状态', () => {
    expect(buildJsonPathPanelUiState(buildInput({ normalizedQuery: '' })).favoriteToggleTitle)
      .toBe('请输入 JSONPath 表达式或字段名后可收藏');
    expect(buildJsonPathPanelUiState(buildInput({ isCurrentQueryFavorite: true })).favoriteToggleTitle)
      .toBe('取消收藏当前查询');
    expect(buildJsonPathPanelUiState(buildInput({ cancelledQuery: '$.a' })).showCancelledQuery)
      .toBe(true);
  });

  it('按查询运行前置条件生成按钮 title', () => {
    expect(buildJsonPathPanelUiState(buildInput({ isDataPreparing: true })).queryButtonTitle)
      .toBe('深度格式化仍在处理，请稍后查询');
    expect(buildJsonPathPanelUiState(buildInput({ isQuerying: true })).queryButtonTitle)
      .toBe('JSONPath 查询正在运行，可取消后重新查询');
    expect(buildJsonPathPanelUiState(buildInput({ normalizedQuery: '' })).queryButtonTitle)
      .toBe('请输入 JSONPath 表达式或字段名后查询');
    expect(buildJsonPathPanelUiState(buildInput({ hasJsonData: false })).queryButtonTitle)
      .toBe('请先在 SOURCE 输入 JSON 数据');
  });

  it('为输入框选择错误或结果状态描述', () => {
    expect(buildJsonPathPanelUiState(buildInput({ error: 'bad' })).queryInputDescriptionId)
      .toBe('jsonpath-error');
    expect(buildJsonPathPanelUiState(buildInput({
      totalResults: 2,
      navigableResultCount: 2,
    })).queryInputDescriptionId).toBe('jsonpath-status');
    expect(buildJsonPathPanelUiState(buildInput()).queryInputDescriptionId).toBeUndefined();
  });

  it('只有无错误、无查询中且结果为 0 时显示空结果', () => {
    expect(buildJsonPathPanelUiState(buildInput({ emptyResultQuery: '$.missing' })).showEmptyResult)
      .toBe(true);
    expect(buildJsonPathPanelUiState(buildInput({
      emptyResultQuery: '$.missing',
      totalResults: 1,
    })).showEmptyResult).toBe(false);
  });
});
