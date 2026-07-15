import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TransformMode } from '../types';
import { dispatchChunkLoadRecoveryEvent } from '../utils/chunkLoadRecoveryDispatch';
import { performTransformAsync } from '../utils/transformations';
import { useAppAsyncTransform } from './useAppAsyncTransform';

const reactMocks = vi.hoisted(() => ({
  useEffect: vi.fn(),
  useMemo: vi.fn(),
  useRef: vi.fn(),
  useState: vi.fn(),
}));

vi.mock('react', async importOriginal => ({
  ...await importOriginal<typeof import('react')>(),
  ...reactMocks,
}));

vi.mock('../utils/appAsyncPolicy', async importOriginal => ({
  ...await importOriginal<typeof import('../utils/appAsyncPolicy')>(),
  buildAppAsyncTransformPolicy: vi.fn(() => ({
    shouldUseTransformWorker: false,
    shouldUseDynamicTransform: true,
    shouldUseAsyncTransform: true,
    isSourceLarge: false,
  })),
}));

vi.mock('../utils/chunkLoadRecoveryDispatch', () => ({
  dispatchChunkLoadRecoveryEvent: vi.fn(() => true),
}));

vi.mock('../utils/transformations', () => ({
  performTransformAsync: vi.fn(),
}));

const flushPromiseQueue = () => new Promise(resolve => {
  setTimeout(resolve, 0);
});

describe('useAppAsyncTransform Promise 状态', () => {
  const stateValues: unknown[] = [];
  const requestIdRef = { current: 0 };
  let stateCursor = 0;
  let pendingEffect: (() => void | (() => void)) | null = null;

  beforeEach(() => {
    vi.clearAllMocks();
    stateValues.length = 0;
    requestIdRef.current = 0;
    stateCursor = 0;
    pendingEffect = null;
    reactMocks.useMemo.mockImplementation(factory => factory());
    reactMocks.useRef.mockReturnValue(requestIdRef);
    reactMocks.useState.mockImplementation((initialValue: unknown) => {
      const slot = stateCursor++;
      if (!(slot in stateValues)) stateValues[slot] = initialValue;
      return [stateValues[slot], (nextValue: unknown) => {
        stateValues[slot] = typeof nextValue === 'function'
          ? (nextValue as (currentValue: unknown) => unknown)(stateValues[slot])
          : nextValue;
      }];
    });
    reactMocks.useEffect.mockImplementation(effect => {
      pendingEffect = effect;
    });
  });

  it('旧 chunk 恢复接管后以当前输入降级并结束处理中状态', async () => {
    const input = '{"value":1}';
    const chunkError = new TypeError('Failed to fetch dynamically imported module');
    vi.mocked(performTransformAsync).mockRejectedValue(chunkError);
    vi.mocked(dispatchChunkLoadRecoveryEvent).mockReturnValue(true);
    const useRenderedTransform = () => {
      stateCursor = 0;
      return useAppAsyncTransform({
        input,
        mode: TransformMode.JSON_TO_TYPESCRIPT,
        autoExpandScheme: false,
        isUpdatingFromOutput: false,
      });
    };

    const initialState = useRenderedTransform();
    const cleanup = pendingEffect?.();
    await flushPromiseQueue();
    const settledState = useRenderedTransform();

    expect(initialState.isOutputTransforming).toBe(true);
    expect(dispatchChunkLoadRecoveryEvent).toHaveBeenCalledWith(chunkError);
    expect(settledState.currentAsyncTransformResult).toEqual({
      input,
      mode: TransformMode.JSON_TO_TYPESCRIPT,
      autoExpandScheme: false,
      output: input,
    });
    expect(settledState.isOutputTransforming).toBe(false);
    if (typeof cleanup === 'function') cleanup();
  });
});
