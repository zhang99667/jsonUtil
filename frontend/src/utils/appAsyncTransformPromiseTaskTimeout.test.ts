import { afterEach, describe, expect, it, vi } from 'vitest';
import { TransformMode } from '../types';
import { buildAppAsyncTransformSnapshot } from './appAsyncTransformSnapshot';
import { startAppAsyncTransformPromiseTask } from './appAsyncTransformPromiseTask';
import { performTransformAsync } from './transformations';

vi.mock('./chunkLoadRecoveryDispatch', () => ({
  dispatchChunkLoadRecoveryEvent: vi.fn(() => false),
}));

vi.mock('./transformations', () => ({
  performTransformAsync: vi.fn(),
}));

describe('异步转换任务超时', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('十秒未完成时降级并忽略迟到结果', async () => {
    vi.useFakeTimers();
    let resolveTransform = (_output: string) => {};
    vi.mocked(performTransformAsync).mockReturnValue(new Promise(resolve => {
      resolveTransform = resolve;
    }));
    const snapshot = buildAppAsyncTransformSnapshot(
      '{"value":1}',
      TransformMode.JSON_TO_TYPESCRIPT,
      false,
    );
    const onSetAsyncTransformResult = vi.fn();
    const onSetOutputTransforming = vi.fn();
    const onWarn = vi.fn();

    startAppAsyncTransformPromiseTask({
      requestId: 11,
      snapshot,
      isCurrentRequest: requestId => requestId === 11,
      onSetAsyncTransformResult,
      onSetOutputTransforming,
      onWarn,
    });
    await vi.advanceTimersByTimeAsync(10_000);
    const fallbackResult = { ...snapshot, output: snapshot.input };
    expect(onSetAsyncTransformResult).toHaveBeenCalledWith(fallbackResult);
    expect(onSetOutputTransforming).toHaveBeenCalledWith(false);
    expect(onWarn).toHaveBeenCalledWith('异步转换处理失败:', expect.any(Error));
    expect(onWarn).toHaveBeenCalledOnce();
    expect(vi.getTimerCount()).toBe(0);
    resolveTransform('迟到结果');
    await Promise.resolve();
    expect(onSetAsyncTransformResult).toHaveBeenCalledOnce();
    expect(onSetOutputTransforming).toHaveBeenCalledOnce();
  });

  it('同步抛错时异步降级并清理计时器', async () => {
    vi.useFakeTimers();
    const error = new Error('同步转换失败');
    vi.mocked(performTransformAsync).mockImplementation(() => { throw error; });
    const snapshot = buildAppAsyncTransformSnapshot('raw', TransformMode.JSON_TO_TYPESCRIPT, false);
    const onSetAsyncTransformResult = vi.fn();
    const onSetOutputTransforming = vi.fn();
    const onWarn = vi.fn();

    expect(() => startAppAsyncTransformPromiseTask({
      requestId: 12,
      snapshot,
      isCurrentRequest: requestId => requestId === 12,
      onSetAsyncTransformResult,
      onSetOutputTransforming,
      onWarn,
    })).not.toThrow();
    await vi.advanceTimersByTimeAsync(0);

    expect(onSetAsyncTransformResult).toHaveBeenCalledWith({ ...snapshot, output: snapshot.input });
    expect(onSetOutputTransforming).toHaveBeenCalledWith(false);
    expect(onWarn).toHaveBeenCalledWith('异步转换处理失败:', error);
    expect(vi.getTimerCount()).toBe(0);
  });
});
