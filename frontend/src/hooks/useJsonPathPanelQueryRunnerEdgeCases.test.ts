import { beforeEach, describe, expect, it, vi } from 'vitest';
import { trackToolEvent } from '../utils/productTelemetry';
import {
  emitJsonPathWorkerSuccess,
  FakeJsonPathWorker,
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

const renderRunner = useJsonPathQueryRunnerForTest.bind(null, reactMocks);

describe('useJsonPathPanelQueryRunner 边界分支', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    reactMocks.useCallback.mockReset();
    reactMocks.useEffect.mockReset();
    reactMocks.useReducer.mockReset();
    reactMocks.useRef.mockReset();
  });

  it('深度格式化准备中跳过查询且不回写字段快捷输入', () => {
    const { dispatch, input, runner } = renderRunner({
      query: 'traceId',
      isDataPreparing: true,
    });

    runner.handleQuery();

    expect(input.onSetQuery).not.toHaveBeenCalled();
    expect(dispatch).toHaveBeenCalledWith({
      type: 'skipped',
      error: '深度格式化仍在处理，请稍后查询',
    });
    expect(input.createWorker).not.toHaveBeenCalled();
    expect(trackToolEvent).toHaveBeenCalledWith(expect.objectContaining({ status: 'skipped' }));
  });

  it('空查询跳过时清空结果和高亮', () => {
    const { dispatch, input, runner } = renderRunner({ query: '  ' });

    runner.handleQuery();

    expect(dispatch).toHaveBeenCalledWith({
      type: 'skipped',
      error: '请输入 JSONPath 表达式或字段名',
      clearResults: true,
    });
    expect(input.onHighlightRange).toHaveBeenCalledWith(null);
    expect(input.createWorker).not.toHaveBeenCalled();
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

  it('Worker 运行错误时写入失败状态', () => {
    const { dispatch, input, runner, workers } = renderRunner();
    runner.handleQuery();
    const worker = workers()[0];
    const request = worker.postMessage.mock.calls[0][0];

    worker.emitError('Worker 运行失败');

    expect(dispatch).toHaveBeenCalledWith({
      type: 'failed',
      error: 'JSONPath 查询错误: Worker 运行失败',
    });
    expect(input.onHighlightRange).toHaveBeenLastCalledWith(null);
    expect(trackToolEvent).toHaveBeenCalledWith(expect.objectContaining({ status: 'error' }));

    dispatch.mockClear();
    vi.mocked(input.onHighlightRange).mockClear();
    vi.mocked(input.onAddHistoryItem).mockClear();
    vi.mocked(trackToolEvent).mockClear();
    emitJsonPathWorkerSuccess(worker, request.id);

    expect(worker.terminate).toHaveBeenCalledTimes(1);
    expect(dispatch).not.toHaveBeenCalled();
    expect(input.onHighlightRange).not.toHaveBeenCalled();
    expect(input.onAddHistoryItem).not.toHaveBeenCalled();
    expect(trackToolEvent).not.toHaveBeenCalled();
  });

  it('Worker 创建失败时进入失败状态', () => {
    const createWorker = vi.fn(() => {
      throw new Error('Worker 不可用');
    });
    const { dispatch, input, runner } = renderRunner({ createWorker });

    expect(() => runner.handleQuery()).not.toThrow();

    expect(dispatch).toHaveBeenCalledWith({
      type: 'failed',
      error: 'JSONPath 查询错误: Worker 不可用',
    });
    expect(input.onHighlightRange).toHaveBeenLastCalledWith(null);
    expect(trackToolEvent).toHaveBeenCalledWith(expect.objectContaining({ status: 'error' }));
  });

  it('Worker 发送失败时终止任务并进入失败状态', () => {
    const worker = new FakeJsonPathWorker();
    worker.postMessage.mockImplementation(() => {
      throw new Error('消息发送失败');
    });
    const { dispatch, input, runner } = renderRunner({
      createWorker: vi.fn(() => worker),
    });

    expect(() => runner.handleQuery()).not.toThrow();

    expect(worker.terminate).toHaveBeenCalledTimes(1);
    expect(dispatch).toHaveBeenCalledWith({
      type: 'failed',
      error: 'JSONPath 查询错误: 消息发送失败',
    });
    expect(input.onHighlightRange).toHaveBeenLastCalledWith(null);
    expect(trackToolEvent).toHaveBeenCalledWith(expect.objectContaining({ status: 'error' }));
  });
});
