import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { TransformMode } from '../types';
import { useAppAsyncTransform } from './useAppAsyncTransform';

const reactMocks = vi.hoisted(() => ({
  useEffect: vi.fn(),
  useMemo: vi.fn(),
  useRef: vi.fn(),
  useState: vi.fn(),
}));

const policyMocks = vi.hoisted(() => ({
  buildAppAsyncTransformPolicy: vi.fn(),
}));

vi.mock('react', async importOriginal => ({
  ...await importOriginal<typeof import('react')>(),
  ...reactMocks,
}));

vi.mock('../utils/appAsyncPolicy', async importOriginal => ({
  ...await importOriginal<typeof import('../utils/appAsyncPolicy')>(),
  buildAppAsyncTransformPolicy: policyMocks.buildAppAsyncTransformPolicy,
}));

interface FakeTransformWorker {
  onmessage: ((event: MessageEvent<unknown>) => void) | null;
  onerror: ((event: ErrorEvent) => void) | null;
  postMessage: Mock;
  terminate: Mock;
  emitMessage: (response: unknown) => void;
  emitError: (message: string) => void;
}

const createdWorkers: FakeTransformWorker[] = [];

const createFakeWorker = (): FakeTransformWorker => {
  const worker: FakeTransformWorker = {
    onmessage: null,
    onerror: null,
    postMessage: vi.fn(),
    terminate: vi.fn(),
    emitMessage: response => {
      worker.onmessage?.({ data: response } as MessageEvent<unknown>);
    },
    emitError: message => {
      worker.onerror?.({ message } as ErrorEvent);
    },
  };
  return worker;
};

class FakeWorkerConstructor {
  constructor() {
    const worker = createFakeWorker();
    createdWorkers.push(worker);
    return worker;
  }
}

const useWorkerTransformForTest = () => {
  const effects: Array<() => void | (() => void)> = [];
  const setAsyncTransformResult = vi.fn();
  const setIsOutputTransforming = vi.fn();
  const requestIdRef = { current: 0 };
  const input = '{"value":1}';

  reactMocks.useMemo.mockImplementation(factory => factory());
  reactMocks.useRef.mockImplementationOnce(() => requestIdRef);
  reactMocks.useState
    .mockImplementationOnce(() => [null, setAsyncTransformResult])
    .mockImplementationOnce(() => [false, setIsOutputTransforming]);
  reactMocks.useEffect.mockImplementation(effect => {
    effects.push(effect);
  });

  const result = useAppAsyncTransform({
    input,
    mode: TransformMode.FORMAT,
    autoExpandScheme: false,
    isUpdatingFromOutput: false,
  });

  return {
    effect: effects[0],
    input,
    requestIdRef,
    result,
    setAsyncTransformResult,
    setIsOutputTransforming,
  };
};

describe('useAppAsyncTransform Worker 生命周期', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    Object.values(reactMocks).forEach(mock => mock.mockReset());
    createdWorkers.length = 0;
    policyMocks.buildAppAsyncTransformPolicy.mockReturnValue({
      shouldUseTransformWorker: true,
      shouldUseDynamicTransform: false,
      shouldUseAsyncTransform: true,
      isSourceLarge: true,
    });
    vi.stubGlobal('Worker', FakeWorkerConstructor);
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('异步策略激活后在副作用启动前立即阻止占位内容操作', () => {
    const harness = useWorkerTransformForTest();

    expect(harness.result.shouldUseAsyncTransform).toBe(true);
    expect(harness.result.currentAsyncTransformResult).toBeNull();
    expect(harness.result.isOutputTransforming).toBe(true);
    expect(harness.setIsOutputTransforming).not.toHaveBeenCalled();
  });

  it('Worker 创建失败时受控降级并结束处理中状态', () => {
    class FailingWorkerConstructor {
      constructor() {
        throw new Error('Worker 不可用');
      }
    }
    vi.stubGlobal('Worker', FailingWorkerConstructor);
    const harness = useWorkerTransformForTest();

    expect(() => harness.effect()).not.toThrow();
    expect(harness.setAsyncTransformResult).toHaveBeenLastCalledWith({
      input: harness.input,
      mode: TransformMode.FORMAT,
      autoExpandScheme: false,
      output: harness.input,
    });
    expect(harness.setIsOutputTransforming).toHaveBeenLastCalledWith(false);
  });

  it('Worker 请求发送失败时立即回收并受控降级', () => {
    class PostMessageFailingWorkerConstructor {
      constructor() {
        const worker = createFakeWorker();
        worker.postMessage.mockImplementation(() => {
          throw new Error('消息发送失败');
        });
        createdWorkers.push(worker);
        return worker;
      }
    }
    vi.stubGlobal('Worker', PostMessageFailingWorkerConstructor);
    const harness = useWorkerTransformForTest();

    expect(() => harness.effect()).not.toThrow();
    expect(createdWorkers[0].terminate).toHaveBeenCalledTimes(1);
    expect(harness.setAsyncTransformResult).toHaveBeenLastCalledWith(expect.objectContaining({
      output: harness.input,
    }));
    expect(harness.setIsOutputTransforming).toHaveBeenLastCalledWith(false);
  });

  it('成功响应后立即回收且重复事件不会再次写入', () => {
    const harness = useWorkerTransformForTest();
    const cleanup = harness.effect();
    const worker = createdWorkers[0];
    const request = worker.postMessage.mock.calls[0][0];
    harness.setAsyncTransformResult.mockClear();
    harness.setIsOutputTransforming.mockClear();

    worker.emitMessage({ id: request.id, output: 'formatted' });
    worker.emitError('迟到错误');
    if (typeof cleanup === 'function') cleanup();

    expect(worker.terminate).toHaveBeenCalledTimes(1);
    expect(harness.setAsyncTransformResult).toHaveBeenCalledTimes(1);
    expect(harness.setAsyncTransformResult).toHaveBeenCalledWith(expect.objectContaining({
      output: 'formatted',
    }));
    expect(harness.setIsOutputTransforming).toHaveBeenCalledTimes(1);
    expect(harness.setIsOutputTransforming).toHaveBeenCalledWith(false);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('Worker 十秒无响应时终止任务并写入 fallback', () => {
    const harness = useWorkerTransformForTest();
    harness.effect();
    const worker = createdWorkers[0];
    harness.setAsyncTransformResult.mockClear();
    harness.setIsOutputTransforming.mockClear();

    vi.advanceTimersByTime(9_999);
    expect(worker.terminate).not.toHaveBeenCalled();
    expect(harness.setAsyncTransformResult).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(worker.terminate).toHaveBeenCalledTimes(1);
    expect(harness.setAsyncTransformResult).toHaveBeenCalledWith(expect.objectContaining({
      output: harness.input,
    }));
    expect(harness.setIsOutputTransforming).toHaveBeenCalledWith(false);
    expect(vi.getTimerCount()).toBe(0);
  });

  it.each([
    ['空响应', null],
    ['错误输出类型', { id: 1, output: 42 }],
    ['错误上下文类型', { id: 1, output: 'formatted', context: {} }],
  ])('%s 不会抛出且会立即降级', (_name, response) => {
    const harness = useWorkerTransformForTest();
    harness.effect();
    const worker = createdWorkers[0];
    harness.setAsyncTransformResult.mockClear();
    harness.setIsOutputTransforming.mockClear();

    expect(() => worker.emitMessage(response)).not.toThrow();
    expect(worker.terminate).toHaveBeenCalledTimes(1);
    expect(harness.setAsyncTransformResult).toHaveBeenCalledWith(expect.objectContaining({
      output: harness.input,
    }));
    expect(harness.setIsOutputTransforming).toHaveBeenCalledWith(false);
  });

  it('同步响应完成后不遗留超时计时器', () => {
    class SynchronousWorkerConstructor {
      constructor() {
        const worker = createFakeWorker();
        worker.postMessage.mockImplementation((request: { id: number }) => {
          worker.emitMessage({ id: request.id, output: 'formatted' });
        });
        createdWorkers.push(worker);
        return worker;
      }
    }
    vi.stubGlobal('Worker', SynchronousWorkerConstructor);
    const harness = useWorkerTransformForTest();

    harness.effect();

    expect(createdWorkers[0].terminate).toHaveBeenCalledTimes(1);
    expect(harness.setAsyncTransformResult).toHaveBeenLastCalledWith(expect.objectContaining({
      output: 'formatted',
    }));
    expect(vi.getTimerCount()).toBe(0);
  });

  it.each(['response', 'runtime'] as const)('%s 错误后立即回收并写入 fallback', failureType => {
    const harness = useWorkerTransformForTest();
    const cleanup = harness.effect();
    const worker = createdWorkers[0];
    const request = worker.postMessage.mock.calls[0][0];
    harness.setAsyncTransformResult.mockClear();
    harness.setIsOutputTransforming.mockClear();

    if (failureType === 'response') {
      worker.emitMessage({ id: request.id, output: '错误输出', error: '转换失败' });
    } else {
      worker.emitError('Worker 运行失败');
    }
    if (typeof cleanup === 'function') cleanup();

    expect(worker.terminate).toHaveBeenCalledTimes(1);
    expect(harness.setAsyncTransformResult).toHaveBeenCalledWith(expect.objectContaining({
      output: harness.input,
    }));
    expect(harness.setIsOutputTransforming).toHaveBeenCalledTimes(1);
    expect(harness.setIsOutputTransforming).toHaveBeenCalledWith(false);
  });

  it('响应标识不匹配时结束悬挂任务并降级', () => {
    const harness = useWorkerTransformForTest();
    harness.effect();
    const worker = createdWorkers[0];
    harness.setAsyncTransformResult.mockClear();
    harness.setIsOutputTransforming.mockClear();

    worker.emitMessage({ id: 99, output: 'wrong' });

    expect(worker.terminate).toHaveBeenCalledTimes(1);
    expect(harness.setAsyncTransformResult).toHaveBeenCalledWith(expect.objectContaining({
      output: harness.input,
    }));
    expect(harness.setIsOutputTransforming).toHaveBeenCalledWith(false);
  });

  it('清理后忽略已经排队的晚到回调', () => {
    const harness = useWorkerTransformForTest();
    const cleanup = harness.effect();
    const worker = createdWorkers[0];
    const request = worker.postMessage.mock.calls[0][0];
    const queuedMessage = worker.onmessage;
    const queuedError = worker.onerror;
    if (typeof cleanup === 'function') cleanup();
    harness.setAsyncTransformResult.mockClear();
    harness.setIsOutputTransforming.mockClear();

    queuedMessage?.({ data: { id: request.id, output: 'late' } } as MessageEvent<unknown>);
    queuedError?.({ message: 'late error' } as ErrorEvent);

    expect(worker.terminate).toHaveBeenCalledTimes(1);
    expect(harness.setAsyncTransformResult).not.toHaveBeenCalled();
    expect(harness.setIsOutputTransforming).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });
});
