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

  it('当前 Worker 返回错误响应 ID 时终止查询并报告协议错误', () => {
    const { dispatch, input, runner, workers } = renderRunner();
    runner.handleQuery();
    const worker = workers()[0];
    const request = worker.postMessage.mock.calls[0][0];

    emitJsonPathWorkerSuccess(worker, request.id + 1);

    expect(worker.terminate).toHaveBeenCalledTimes(1);
    expect(dispatch).toHaveBeenCalledWith({
      type: 'failed',
      error: 'JSONPath 查询错误: Worker 响应标识不匹配',
    });
    expect(input.onAddHistoryItem).not.toHaveBeenCalled();
    expect(trackToolEvent).toHaveBeenCalledWith(expect.objectContaining({ status: 'error' }));
  });

  it('卸载后忽略当前 Worker 已排队的消息和错误', () => {
    const { cleanups, dispatch, input, runner, workers } = renderRunner();
    runner.handleQuery();
    const worker = workers()[0];
    const request = worker.postMessage.mock.calls[0][0];
    cleanups[0]();
    dispatch.mockClear();
    vi.mocked(input.onHighlightRange).mockClear();
    vi.mocked(trackToolEvent).mockClear();

    emitJsonPathWorkerSuccess(worker, request.id);
    worker.emitError('迟到错误');

    expect(dispatch).not.toHaveBeenCalled();
    expect(worker.terminate).toHaveBeenCalledTimes(1);
    expect(input.onHighlightRange).not.toHaveBeenCalled();
    expect(input.onAddHistoryItem).not.toHaveBeenCalled();
    expect(trackToolEvent).not.toHaveBeenCalled();
  });

  it('查询完成后忽略同一 Worker 的重复消息和错误', () => {
    const { dispatch, input, runner, workers } = renderRunner();
    runner.handleQuery();
    const worker = workers()[0];
    const request = worker.postMessage.mock.calls[0][0];
    emitJsonPathWorkerSuccess(worker, request.id);
    dispatch.mockClear();
    vi.mocked(input.onAddHistoryItem).mockClear();
    vi.mocked(input.onHighlightRange).mockClear();
    vi.mocked(trackToolEvent).mockClear();

    emitJsonPathWorkerSuccess(worker, request.id);
    worker.emitError('重复错误');

    expect(worker.terminate).toHaveBeenCalledTimes(1);
    expect(dispatch).not.toHaveBeenCalled();
    expect(input.onAddHistoryItem).not.toHaveBeenCalled();
    expect(input.onHighlightRange).not.toHaveBeenCalled();
    expect(trackToolEvent).not.toHaveBeenCalled();
  });

  it('取消查询时终止当前 worker 并让旧消息失效', () => {
    const { dispatch, input, runner, workers } = renderRunner({}, { isQuerying: true });
    runner.handleQuery('$.slow');
    const worker = workers()[0];
    const request = worker.postMessage.mock.calls[0][0];

    runner.handleCancelQuery();
    emitJsonPathWorkerSuccess(worker, request.id, {
      values: ['late'],
      items: [],
    });

    expect(worker.terminate).toHaveBeenCalledTimes(1);
    expect(dispatch).toHaveBeenCalledWith({ type: 'cancelled', query: '$.slow' });
    expect(input.onHighlightRange).toHaveBeenCalledWith(null);
    expect(showSuccess).toHaveBeenCalledWith('已取消查询', 1600);
    expect(dispatch).not.toHaveBeenCalledWith(expect.objectContaining({ type: 'success' }));
  });

  it('卸载时终止当前 worker', () => {
    const { cleanups, runner, workers } = renderRunner();
    runner.handleQuery();

    cleanups[0]();

    expect(workers()[0].terminate).toHaveBeenCalledTimes(1);
  });
});
