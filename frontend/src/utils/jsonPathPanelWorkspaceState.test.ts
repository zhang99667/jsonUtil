import { describe, expect, it } from 'vitest';
import type { HighlightRange } from '../types';
import {
  createJsonPathPanelWorkspaceState,
  getJsonPathPanelWorkspaceState,
  reconcileJsonPathPanelWorkspaceStates,
  reduceJsonPathPanelWorkspaceQueryState,
  setJsonPathPanelWorkspaceQuery,
  type JsonPathPanelWorkspaceContext,
  type JsonPathPanelWorkspaceStateMap,
} from './jsonPathPanelWorkspaceState';

const firstContext: JsonPathPanelWorkspaceContext = {
  jsonData: '{"tab":"first"}',
  deepFormat: true,
  autoExpandScheme: false,
  isOpen: true,
};
const secondContext: JsonPathPanelWorkspaceContext = {
  ...firstContext,
  jsonData: '{"tab":"second"}',
};
const firstRange: HighlightRange = {
  startLine: 1,
  startColumn: 1,
  endLine: 1,
  endColumn: 6,
};

const addSuccessfulResult = (
  states: JsonPathPanelWorkspaceStateMap,
  workspaceId: string | null,
  context: JsonPathPanelWorkspaceContext,
  value: string,
) => reduceJsonPathPanelWorkspaceQueryState(states, workspaceId, context, {
  type: 'success',
  payload: {
    ranges: [firstRange],
    values: [value],
    items: [{ path: '$.tab', pointer: '/tab', range: firstRange, value }],
    totalResults: 1,
    isLimited: false,
    resultLimit: 1000,
  },
});

describe('jsonPathPanelWorkspaceState', () => {
  it('按文件工作区独立保存查询文本、结果和当前索引', () => {
    let states: JsonPathPanelWorkspaceStateMap = new Map();
    states = setJsonPathPanelWorkspaceQuery(states, 'file-a', firstContext, '$.first');
    states = addSuccessfulResult(states, 'file-a', firstContext, 'first-result');
    states = setJsonPathPanelWorkspaceQuery(states, 'file-b', secondContext, '$.second');
    states = addSuccessfulResult(states, 'file-b', secondContext, 'second-result');

    expect(getJsonPathPanelWorkspaceState(states, 'file-a', firstContext)).toMatchObject({
      query: '$.first',
      queryState: { queryValues: ['first-result'], currentResultIndex: 0 },
    });
    expect(getJsonPathPanelWorkspaceState(states, 'file-b', secondContext)).toMatchObject({
      query: '$.second',
      queryState: { queryValues: ['second-result'], currentResultIndex: 0 },
    });
  });

  it('当前 Tab 数据变化时保留查询文本并清空旧结果', () => {
    let states: JsonPathPanelWorkspaceStateMap = new Map();
    states = setJsonPathPanelWorkspaceQuery(states, 'file-a', firstContext, '$.tab');
    states = addSuccessfulResult(states, 'file-a', firstContext, 'first-result');

    const restored = getJsonPathPanelWorkspaceState(states, 'file-a', secondContext);

    expect(restored.query).toBe('$.tab');
    expect(restored.queryState.queryValues).toEqual([]);
    expect(restored.queryState.queryRanges).toEqual([]);
  });

  it('切换 Tab 时把运行态归一化为安全初始态，并清理已关闭文件', () => {
    let states: JsonPathPanelWorkspaceStateMap = new Map([
      ['file-a', createJsonPathPanelWorkspaceState(firstContext, '$.first')],
      ['file-b', createJsonPathPanelWorkspaceState(secondContext, '$.second')],
      ['file-closed', createJsonPathPanelWorkspaceState(firstContext, '$.closed')],
      [null, createJsonPathPanelWorkspaceState(firstContext, '$.standalone')],
    ]);
    states = reduceJsonPathPanelWorkspaceQueryState(states, 'file-a', firstContext, { type: 'start' });

    const reconciled = reconcileJsonPathPanelWorkspaceStates({
      states,
      activeWorkspaceId: 'file-b',
      retainedWorkspaceIds: ['file-a', 'file-b'],
      activeContext: secondContext,
    });

    expect(reconciled.has('file-closed')).toBe(false);
    expect(reconciled.get('file-a')?.queryState.isQuerying).toBe(false);
    expect(reconciled.get('file-b')?.query).toBe('$.second');
    expect(reconciled.get('file-b')?.queryState.isQuerying).toBe(false);
    expect(reconciled.get(null)?.query).toBe('$.standalone');
  });

  it('不同工作区的初始结果数组不共享引用', () => {
    const first = createJsonPathPanelWorkspaceState(firstContext);
    const second = createJsonPathPanelWorkspaceState(secondContext);

    expect(first.queryState).not.toBe(second.queryState);
    expect(first.queryState.queryRanges).not.toBe(second.queryState.queryRanges);
    expect(first.queryState.queryValues).not.toBe(second.queryState.queryValues);
    expect(first.queryState.queryItems).not.toBe(second.queryState.queryItems);
  });
});
