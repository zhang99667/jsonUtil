import { beforeEach, describe, expect, it, vi } from 'vitest';
import { trackToolEvent } from '../utils/productTelemetry';
import { showSuccess } from '../utils/toast';
import {
  range,
  useJsonPathQueryRunnerForTest,
} from './useJsonPathPanelQueryRunnerTestFixture';

const reactMocks = vi.hoisted(() => ({
  useCallback: vi.fn(),
  useEffect: vi.fn(),
  useReducer: vi.fn(),
  useRef: vi.fn(),
}));

vi.mock('react', async importOriginal => ({
  ...await importOriginal<typeof import('react')>(),
  useCallback: reactMocks.useCallback,
  useEffect: reactMocks.useEffect,
  useReducer: reactMocks.useReducer,
  useRef: reactMocks.useRef,
}));

vi.mock('../utils/productTelemetry', async importOriginal => ({
  ...await importOriginal<typeof import('../utils/productTelemetry')>(),
  trackToolEvent: vi.fn(),
}));

vi.mock('../utils/toast', async importOriginal => ({
  ...await importOriginal<typeof import('../utils/toast')>(),
  showSuccess: vi.fn(),
}));

const renderRunner = useJsonPathQueryRunnerForTest.bind(null, reactMocks);

describe('useJsonPathPanelQueryRunner', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    reactMocks.useCallback.mockReset();
    reactMocks.useEffect.mockReset();
    reactMocks.useReducer.mockReset();
    reactMocks.useRef.mockReset();
  });

  it('启动查询时创建 worker 并发送查询请求', () => {
    const { dispatch, input, runner, workers } = renderRunner();

    runner.handleQuery();

    expect(dispatch).toHaveBeenCalledWith({ type: 'prepare' });
    expect(dispatch).toHaveBeenCalledWith({ type: 'start' });
    expect(input.onHighlightRange).toHaveBeenCalledWith(null);
    expect(workers()[0].postMessage).toHaveBeenCalledWith({
      id: 2,
      jsonData: '{"name":"Ada"}',
      query: '$.name',
      options: {
        deepFormat: true,
        autoExpandScheme: true,
      },
    });
  });

  it('空 JSON 下字段名快捷输入先同步查询框且不启动 worker', () => {
    const { dispatch, input, runner } = renderRunner({
      query: 'traceId',
      jsonData: '  ',
    });

    runner.handleQuery();

    expect(input.onSetQuery).toHaveBeenCalledWith('$..traceId');
    expect(dispatch).toHaveBeenCalledWith({
      type: 'skipped',
      error: '请先在左侧输入 JSON 数据',
    });
    expect(input.createWorker).not.toHaveBeenCalled();
  });

  it('查询成功时写入结果、聚焦第一项并记录历史', () => {
    const { dispatch, input, runner, workers } = renderRunner();
    runner.handleQuery();
    const request = workers()[0].postMessage.mock.calls[0][0];

    workers()[0].emitMessage({
      id: request.id,
      ranges: [range],
      values: ['Ada'],
      items: [{ path: '$.name', pointer: '/name', range, value: 'Ada' }],
      totalResults: 1,
      isLimited: false,
      resultLimit: 1000,
    });

    expect(workers()[0].terminate).toHaveBeenCalledTimes(1);
    expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({ type: 'success' }));
    expect(input.onHighlightRange).toHaveBeenLastCalledWith(range);
    expect(input.onAddHistoryItem).toHaveBeenCalledWith('$.name');
    expect(trackToolEvent).toHaveBeenCalledWith(expect.objectContaining({
      eventName: 'JSONPATH_QUERY',
      status: 'success',
    }));
  });

  it('忽略旧请求晚到结果，连续查询会终止旧 worker', () => {
    const { dispatch, runner, workers } = renderRunner();

    runner.handleQuery('$.first');
    runner.handleQuery('$.second');
    const staleRequest = workers()[0].postMessage.mock.calls[0][0];
    workers()[0].emitMessage({
      id: staleRequest.id,
      ranges: [range],
      values: ['old'],
      items: [],
      totalResults: 1,
      isLimited: false,
      resultLimit: 1000,
    });

    expect(workers()[0].terminate).toHaveBeenCalledTimes(1);
    expect(dispatch).not.toHaveBeenCalledWith(expect.objectContaining({ type: 'success' }));
    expect(workers()[1].postMessage).toHaveBeenCalledWith(expect.objectContaining({
      id: staleRequest.id + 1,
      query: '$.second',
    }));
  });

  it('取消查询时终止当前 worker 并让旧消息失效', () => {
    const { dispatch, input, runner, workers } = renderRunner({}, { isQuerying: true });
    runner.handleQuery('$.slow');

    runner.handleCancelQuery();
    workers()[0].emitMessage({
      id: 1,
      ranges: [range],
      values: ['late'],
      items: [],
      totalResults: 1,
      isLimited: false,
      resultLimit: 1000,
    });

    expect(workers()[0].terminate).toHaveBeenCalledTimes(1);
    expect(dispatch).toHaveBeenCalledWith({ type: 'cancelled', query: '$.slow' });
    expect(input.onHighlightRange).toHaveBeenCalledWith(null);
    expect(showSuccess).toHaveBeenCalledWith('已取消查询', 1600);
    expect(dispatch).not.toHaveBeenCalledWith(expect.objectContaining({ type: 'success' }));
  });

  it('worker 错误时写入失败状态', () => {
    const { dispatch, input, runner, workers } = renderRunner();
    runner.handleQuery();

    workers()[0].emitError('worker failed');

    expect(dispatch).toHaveBeenCalledWith({ type: 'failed', error: 'JSONPath 查询错误: worker failed' });
    expect(input.onHighlightRange).toHaveBeenLastCalledWith(null);
    expect(trackToolEvent).toHaveBeenCalledWith(expect.objectContaining({ status: 'error' }));
  });

  it('卸载时终止当前 worker', () => {
    const { cleanups, runner, workers } = renderRunner();
    runner.handleQuery();

    cleanups[0]();

    expect(workers()[0].terminate).toHaveBeenCalledTimes(1);
  });
});
