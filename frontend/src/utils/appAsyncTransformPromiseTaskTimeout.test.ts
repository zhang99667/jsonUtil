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
    const stateAtTimeout = {
      results: onSetAsyncTransformResult.mock.calls.map(([result]) => [result]),
      loading: onSetOutputTransforming.mock.calls.map(([isLoading]) => [isLoading]),
      warnings: onWarn.mock.calls.map(([message]) => message),
      timers: vi.getTimerCount(),
    };

    resolveTransform('迟到结果');
    await Promise.resolve();

    const fallbackResult = { ...snapshot, output: snapshot.input };
    expect({
      stateAtTimeout,
      finalResults: onSetAsyncTransformResult.mock.calls,
      finalLoading: onSetOutputTransforming.mock.calls,
    }).toEqual({
      stateAtTimeout: {
        results: [[fallbackResult]],
        loading: [[false]],
        warnings: ['异步转换处理失败:'],
        timers: 0,
      },
      finalResults: [[fallbackResult]],
      finalLoading: [[false]],
    });
  });
});
