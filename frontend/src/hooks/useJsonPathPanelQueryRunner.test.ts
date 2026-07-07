import { beforeEach, describe, expect, it, vi } from 'vitest';
import { trackToolEvent } from '../utils/productTelemetry';
import { showSuccess } from '../utils/toast';
import {
  emitJsonPathWorkerSuccess,
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

  it('查询成功时写入结果、聚焦第一项并记录历史', () => {
    const { dispatch, input, runner, workers } = renderRunner();
    runner.handleQuery();
    const request = workers()[0].postMessage.mock.calls[0][0];

    emitJsonPathWorkerSuccess(workers()[0], request.id);

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
    emitJsonPathWorkerSuccess(workers()[0], staleRequest.id, {
      values: ['old'],
      items: [],
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
    emitJsonPathWorkerSuccess(workers()[0], 1, {
      values: ['late'],
      items: [],
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
