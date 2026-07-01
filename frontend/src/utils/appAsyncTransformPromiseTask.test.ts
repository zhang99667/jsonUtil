import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TransformMode } from '../types';
import { buildAppAsyncTransformSnapshot } from './appAsyncTransformSnapshot';
import { dispatchChunkLoadRecoveryEvent } from './chunkLoadRecoveryDispatch';
import { startAppAsyncTransformPromiseTask } from './appAsyncTransformPromiseTask';
import { performTransformAsync } from './transformations';

vi.mock('./chunkLoadRecoveryDispatch', () => ({
  dispatchChunkLoadRecoveryEvent: vi.fn(() => false),
}));

vi.mock('./transformations', () => ({
  performTransformAsync: vi.fn(),
}));

const flushPromiseQueue = () => new Promise(resolve => {
  setTimeout(resolve, 0);
});

describe('appAsyncTransformPromiseTask', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(dispatchChunkLoadRecoveryEvent).mockReturnValue(false);
  });

  it('成功转换时写入当前请求结果并结束处理中状态', async () => {
    const snapshot = buildAppAsyncTransformSnapshot('{"a":1}', TransformMode.JSON_TO_TYPESCRIPT, false);
    const onSetAsyncTransformResult = vi.fn();
    const onSetOutputTransforming = vi.fn();
    vi.mocked(performTransformAsync).mockResolvedValue('interface Root { a: number }');

    startAppAsyncTransformPromiseTask({
      requestId: 7,
      snapshot,
      isCurrentRequest: requestId => requestId === 7,
      onSetAsyncTransformResult,
      onSetOutputTransforming,
    });
    await flushPromiseQueue();

    expect(performTransformAsync).toHaveBeenCalledWith('{"a":1}', TransformMode.JSON_TO_TYPESCRIPT);
    expect(onSetAsyncTransformResult).toHaveBeenCalledWith({
      ...snapshot,
      output: 'interface Root { a: number }',
    });
    expect(onSetOutputTransforming).toHaveBeenCalledWith(false);
  });

  it('旧 chunk 失效时交给统一恢复并结束处理中状态', async () => {
    const error = new TypeError('Failed to fetch dynamically imported module');
    const onSetAsyncTransformResult = vi.fn();
    const onSetOutputTransforming = vi.fn();
    const onWarn = vi.fn();
    vi.mocked(performTransformAsync).mockRejectedValue(error);
    vi.mocked(dispatchChunkLoadRecoveryEvent).mockReturnValue(true);

    startAppAsyncTransformPromiseTask({
      requestId: 8,
      snapshot: buildAppAsyncTransformSnapshot('{"a":1}', TransformMode.JSON_TO_TYPESCRIPT, false),
      isCurrentRequest: requestId => requestId === 8,
      onSetAsyncTransformResult,
      onSetOutputTransforming,
      onWarn,
    });
    await flushPromiseQueue();

    expect(dispatchChunkLoadRecoveryEvent).toHaveBeenCalledWith(error);
    expect(onSetAsyncTransformResult).not.toHaveBeenCalled();
    expect(onWarn).not.toHaveBeenCalled();
    expect(onSetOutputTransforming).toHaveBeenCalledWith(false);
  });

  it('业务错误时写入 fallback 结果并输出警告', async () => {
    const error = new Error('转换失败');
    const snapshot = buildAppAsyncTransformSnapshot('raw', TransformMode.JSON_TO_TYPESCRIPT, false);
    const onSetAsyncTransformResult = vi.fn();
    const onSetOutputTransforming = vi.fn();
    const onWarn = vi.fn();
    vi.mocked(performTransformAsync).mockRejectedValue(error);

    startAppAsyncTransformPromiseTask({
      requestId: 9,
      snapshot,
      isCurrentRequest: requestId => requestId === 9,
      onSetAsyncTransformResult,
      onSetOutputTransforming,
      onWarn,
    });
    await flushPromiseQueue();

    expect(dispatchChunkLoadRecoveryEvent).toHaveBeenCalledWith(error);
    expect(onWarn).toHaveBeenCalledWith('异步转换处理失败:', error);
    expect(onSetAsyncTransformResult).toHaveBeenCalledWith({
      ...snapshot,
      output: 'raw',
    });
    expect(onSetOutputTransforming).toHaveBeenCalledWith(false);
  });

  it('取消或过期请求不会写入结果和恢复事件', async () => {
    const error = new Error('已过期');
    const onSetAsyncTransformResult = vi.fn();
    const onSetOutputTransforming = vi.fn();
    const onWarn = vi.fn();
    vi.mocked(performTransformAsync).mockRejectedValue(error);

    startAppAsyncTransformPromiseTask({
      requestId: 10,
      snapshot: buildAppAsyncTransformSnapshot('raw', TransformMode.JSON_TO_TYPESCRIPT, false),
      isCurrentRequest: () => false,
      onSetAsyncTransformResult,
      onSetOutputTransforming,
      onWarn,
    });
    await flushPromiseQueue();

    expect(dispatchChunkLoadRecoveryEvent).not.toHaveBeenCalled();
    expect(onSetAsyncTransformResult).not.toHaveBeenCalled();
    expect(onSetOutputTransforming).not.toHaveBeenCalled();
    expect(onWarn).not.toHaveBeenCalled();
  });
});
