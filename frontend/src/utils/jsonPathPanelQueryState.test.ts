import { describe, expect, it } from 'vitest';
import type { HighlightRange } from '../types';
import type { JsonPathQueryItem } from './jsonPathQuery';
import {
  initialJsonPathPanelQueryState,
  jsonPathPanelQueryStateReducer,
  type JsonPathPanelQueryState,
} from './jsonPathPanelQueryState';

const range: HighlightRange = {
  startLine: 1,
  startColumn: 3,
  endLine: 1,
  endColumn: 8,
};

const item: JsonPathQueryItem = {
  range,
  value: 'json',
  path: '$.name',
  pointer: '/name',
};

const createBusyState = (): JsonPathPanelQueryState => ({
  error: '旧错误',
  queryRanges: [range],
  queryValues: ['old'],
  queryItems: [item],
  currentResultIndex: 2,
  totalResults: 4,
  isResultLimited: true,
  resultLimit: 100,
  emptyResultQuery: '$.missing',
  isQuerying: true,
  cancelledQuery: '$.old',
});

describe('jsonPathPanelQueryStateReducer', () => {
  it('开始查询时清空旧结果并进入运行态', () => {
    const nextState = jsonPathPanelQueryStateReducer(createBusyState(), { type: 'start' });

    expect(nextState).toMatchObject({
      error: '',
      queryRanges: [],
      queryValues: [],
      queryItems: [],
      currentResultIndex: 0,
      totalResults: 0,
      isResultLimited: false,
      resultLimit: 0,
      emptyResultQuery: '',
      isQuerying: true,
      cancelledQuery: '',
    });
  });

  it('查询成功时写入结果并重置游标', () => {
    const nextState = jsonPathPanelQueryStateReducer(createBusyState(), {
      type: 'success',
      payload: {
        ranges: [range],
        values: ['json'],
        items: [item],
        totalResults: 1,
        isLimited: false,
        resultLimit: 1000,
      },
    });

    expect(nextState).toMatchObject({
      error: '',
      queryRanges: [range],
      queryValues: ['json'],
      queryItems: [item],
      currentResultIndex: 0,
      totalResults: 1,
      isResultLimited: false,
      resultLimit: 1000,
      emptyResultQuery: '',
      isQuerying: false,
      cancelledQuery: '',
    });
  });

  it('空结果、失败和取消都会清理可导航结果', () => {
    expect(jsonPathPanelQueryStateReducer(createBusyState(), {
      type: 'empty',
      query: '$.missing',
    })).toMatchObject({
      queryRanges: [],
      queryValues: [],
      queryItems: [],
      emptyResultQuery: '$.missing',
      isQuerying: false,
    });

    expect(jsonPathPanelQueryStateReducer(createBusyState(), {
      type: 'failed',
      error: '查询失败',
    })).toMatchObject({
      error: '查询失败',
      queryRanges: [],
      queryValues: [],
      queryItems: [],
      emptyResultQuery: '',
      isQuerying: false,
    });

    expect(jsonPathPanelQueryStateReducer(createBusyState(), {
      type: 'cancelled',
      query: '$.slow',
    })).toMatchObject({
      error: '',
      queryRanges: [],
      queryValues: [],
      queryItems: [],
      cancelledQuery: '$.slow',
      isQuerying: false,
    });
  });

  it('输入变化只清理取消提示，保留错误和结果上下文', () => {
    const state = createBusyState();
    const nextState = jsonPathPanelQueryStateReducer(state, { type: 'clearCancelled' });

    expect(nextState).toEqual({
      ...state,
      cancelledQuery: '',
    });
  });

  it('重置和结果聚焦不修改无关状态', () => {
    expect(jsonPathPanelQueryStateReducer(createBusyState(), { type: 'reset' })).toEqual(
      initialJsonPathPanelQueryState
    );

    expect(jsonPathPanelQueryStateReducer(createBusyState(), {
      type: 'focus',
      index: 1,
    })).toEqual({
      ...createBusyState(),
      currentResultIndex: 1,
    });
  });
});
