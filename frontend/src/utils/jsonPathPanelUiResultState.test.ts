import { describe, expect, it } from 'vitest';
import {
  buildJsonPathPanelUiResultState,
  type JsonPathPanelUiResultStateInput,
} from './jsonPathPanelUiResultState';

const buildInput = (
  overrides: Partial<JsonPathPanelUiResultStateInput> = {}
): JsonPathPanelUiResultStateInput => ({
  isResultLimited: false,
  emptyResultQuery: '',
  cancelledQuery: '',
  error: '',
  isQuerying: false,
  totalResults: 0,
  queryItemsCount: 3,
  previewItemsCount: 2,
  ...overrides,
});

describe('jsonPathPanelUiResultState', () => {
  it('组合复制文案和隐藏结果数量', () => {
    expect(buildJsonPathPanelUiResultState(buildInput())).toMatchObject({
      hiddenResultCount: 1,
      copyButtonLabel: '复制全部结果',
      copyPathValueButtonLabel: '复制路径和值',
    });
  });

  it('命中上限时提示复制已返回结果', () => {
    expect(buildJsonPathPanelUiResultState(buildInput({ isResultLimited: true }))).toMatchObject({
      copyButtonLabel: '复制已返回结果',
      copyPathValueButtonLabel: '复制已返回路径和值',
    });
  });

  it('隐藏结果数量不会小于 0', () => {
    expect(buildJsonPathPanelUiResultState(buildInput({
      queryItemsCount: 1,
      previewItemsCount: 3,
    })).hiddenResultCount).toBe(0);
  });

  it('只有无错误、无查询中且结果为 0 时显示空结果', () => {
    expect(buildJsonPathPanelUiResultState(buildInput({ emptyResultQuery: '$.missing' })).showEmptyResult)
      .toBe(true);
    expect(buildJsonPathPanelUiResultState(buildInput({
      emptyResultQuery: '$.missing',
      totalResults: 1,
    })).showEmptyResult).toBe(false);
  });

  it('区分取消查询状态且受错误和查询中状态抑制', () => {
    expect(buildJsonPathPanelUiResultState(buildInput({ cancelledQuery: '$.slow' })).showCancelledQuery)
      .toBe(true);
    expect(buildJsonPathPanelUiResultState(buildInput({
      cancelledQuery: '$.slow',
      error: 'bad query',
    })).showCancelledQuery).toBe(false);
    expect(buildJsonPathPanelUiResultState(buildInput({
      cancelledQuery: '$.slow',
      isQuerying: true,
    })).showCancelledQuery).toBe(false);
  });
});
