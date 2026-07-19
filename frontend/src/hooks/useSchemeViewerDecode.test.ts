import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import type { SchemeDecodeResult } from '../utils/schemeTypes';
import type {
  SchemeDecodeWorker,
  SchemeDecodeWorkerResponse,
} from '../utils/schemeViewerDecodeWorker';
import { useSchemeViewerDecode } from './useSchemeViewerDecode';

const reactMocks = vi.hoisted(() => ({
  useCallback: vi.fn(),
  useDeferredValue: vi.fn(),
  useEffect: vi.fn(),
  useMemo: vi.fn(),
  useRef: vi.fn(),
  useState: vi.fn(),
}));

const decodeMocks = vi.hoisted(() => ({
  deepDecodeScheme: vi.fn(),
}));

vi.mock('react', async importOriginal => ({
  ...await importOriginal<typeof import('react')>(),
  ...reactMocks,
}));

vi.mock('../utils/schemeUtils', async importOriginal => ({
  ...await importOriginal<typeof import('../utils/schemeUtils')>(),
  deepDecodeScheme: decodeMocks.deepDecodeScheme,
}));

interface FakeSchemeDecodeWorker extends SchemeDecodeWorker {
  postMessage: Mock<SchemeDecodeWorker['postMessage']>;
  terminate: Mock<SchemeDecodeWorker['terminate']>;
  emitMessage: (response: SchemeDecodeWorkerResponse) => void;
  emitError: (message: string) => void;
}

interface WorkerState {
  source: string;
  result: SchemeDecodeResult | null;
  metadata: null;
  failed: boolean;
}

interface RenderHookOptions {
  source?: string;
  enabled?: boolean;
  workerState?: WorkerState;
  cancelledSource?: string;
  requestId?: number;
  createWorker?: () => SchemeDecodeWorker;
}

const createDecodedResult = (source: string): SchemeDecodeResult => ({
  original: source,
  decoded: `已解码:${source.length}`,
  layers: [],
  isJson: false,
});

const createFakeWorker = (): FakeSchemeDecodeWorker => {
  const worker: FakeSchemeDecodeWorker = {
    onmessage: null,
    onerror: null,
    postMessage: vi.fn(),
    terminate: vi.fn(),
    emitMessage: response => {
      worker.onmessage?.({ data: response } as MessageEvent<SchemeDecodeWorkerResponse>);
    },
    emitError: message => {
      worker.onerror?.({ message } as ErrorEvent);
    },
  };
  return worker;
};

const useSchemeViewerDecodeForTest = ({
  source = 'x'.repeat(50_000),
  enabled = true,
  workerState = { source: '', result: null, metadata: null, failed: false },
  cancelledSource = '',
  requestId = 0,
  createWorker,
}: RenderHookOptions = {}) => {
  const effects: Array<() => void | (() => void)> = [];
  const setWorkerState = vi.fn();
  const setCancelledSource = vi.fn();
  const workerRef = { current: null as SchemeDecodeWorker | null };
  const requestIdRef = { current: requestId };
  const workers: FakeSchemeDecodeWorker[] = [];
  const workerFactory = createWorker ?? (() => {
    const worker = createFakeWorker();
    workers.push(worker);
    return worker;
  });

  reactMocks.useDeferredValue.mockImplementation(value => value);
  reactMocks.useMemo.mockImplementation(factory => factory());
  reactMocks.useCallback.mockImplementation(callback => callback);
  reactMocks.useState
    .mockImplementationOnce(() => [workerState, setWorkerState])
    .mockImplementationOnce(() => [cancelledSource, setCancelledSource]);
  reactMocks.useRef
    .mockImplementationOnce(() => workerRef)
    .mockImplementationOnce(() => requestIdRef);
  reactMocks.useEffect.mockImplementation(effect => {
    effects.push(effect);
  });

  const result = useSchemeViewerDecode(source, {
    enabled,
    createWorker: workerFactory,
  });

  return {
    effects,
    requestIdRef,
    result,
    setCancelledSource,
    setWorkerState,
    workers,
  };
};

describe('useSchemeViewerDecode', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.values(reactMocks).forEach(mock => mock.mockReset());
    decodeMocks.deepDecodeScheme.mockImplementation(createDecodedResult);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('小输入同步解码，达到阈值后改用后台线程', () => {
    const sync = useSchemeViewerDecodeForTest({ source: 'x'.repeat(49_999) });
    const async = useSchemeViewerDecodeForTest({ source: 'x'.repeat(50_000) });

    sync.effects[1]();
    const cleanup = async.effects[1]();

    expect(sync.result.decodeResult.decoded).toBe('已解码:49999');
    expect(sync.workers).toHaveLength(0);
    expect(async.result.isDecodePending).toBe(true);
    expect(async.workers[0].postMessage).toHaveBeenCalledWith({
      id: 1,
      input: 'x'.repeat(50_000),
    });
    if (typeof cleanup === 'function') cleanup();
  });

  it('后台线程十秒无响应时终止线程并同步降级，忽略迟到结果', () => {
    vi.useFakeTimers();
    const source = 'x'.repeat(50_000);
    const harness = useSchemeViewerDecodeForTest({ source });
    harness.effects[1]();
    const lateMessage = harness.workers[0].onmessage;

    vi.advanceTimersByTime(10_000);

    expect(harness.workers[0].terminate).toHaveBeenCalledTimes(1);
    expect(decodeMocks.deepDecodeScheme).toHaveBeenLastCalledWith(source);
    const terminalState = harness.setWorkerState.mock.lastCall?.[0] as WorkerState;
    expect(terminalState).toEqual(expect.objectContaining({
      source,
      result: expect.objectContaining({ decoded: '已解码:50000' }),
      failed: false,
    }));
    expect(useSchemeViewerDecodeForTest({ source, workerState: terminalState }).result.isDecodePending)
      .toBe(false);
    expect(vi.getTimerCount()).toBe(0);

    expect(lateMessage).toBeTypeOf('function');
    const stateWriteCount = harness.setWorkerState.mock.calls.length;
    lateMessage!({
      data: { id: 1, result: createDecodedResult('late') },
    } as MessageEvent<SchemeDecodeWorkerResponse>);
    expect(harness.setWorkerState).toHaveBeenCalledTimes(stateWriteCount);
  });

  it('只接收请求标识匹配的成功结果并补齐元信息', () => {
    const harness = useSchemeViewerDecodeForTest();
    harness.effects[1]();
    const result = createDecodedResult('worker-result');

    harness.workers[0].emitMessage({ id: 1, result });

    expect(harness.workers[0].terminate).toHaveBeenCalledTimes(1);
    expect(harness.setWorkerState).toHaveBeenLastCalledWith(expect.objectContaining({
      source: 'x'.repeat(50_000),
      result,
      metadata: expect.any(Object),
    }));
  });

  it('响应标识不匹配时终止线程并同步降级', () => {
    const harness = useSchemeViewerDecodeForTest();
    harness.effects[1]();

    harness.workers[0].emitMessage({ id: 99, result: createDecodedResult('wrong') });

    expect(harness.workers[0].terminate).toHaveBeenCalledTimes(1);
    expect(decodeMocks.deepDecodeScheme).toHaveBeenLastCalledWith('x'.repeat(50_000));
    expect(harness.setWorkerState).toHaveBeenLastCalledWith(expect.objectContaining({
      result: expect.objectContaining({ decoded: '已解码:50000' }),
      failed: false,
    }));
  });

  it('后台线程与同步降级都失败时显式返回失败态', () => {
    decodeMocks.deepDecodeScheme.mockImplementation(() => {
      throw new Error('同步降级失败');
    });
    const harness = useSchemeViewerDecodeForTest();
    harness.effects[1]();

    harness.workers[0].emitError('后台线程失败');

    expect(harness.setWorkerState).toHaveBeenLastCalledWith(expect.objectContaining({
      result: expect.objectContaining({ original: 'x'.repeat(50_000) }),
      failed: true,
    }));

    const failedState = useSchemeViewerDecodeForTest({
      workerState: {
        source: 'x'.repeat(50_000),
        result: createDecodedResult(''),
        metadata: null,
        failed: true,
      },
    });
    expect(failedState.result.hasDecodeFailed).toBe(true);
  });

  it.each(['response', 'runtime'] as const)('%s 失败时同步降级且不遗留线程', failureType => {
    const harness = useSchemeViewerDecodeForTest();
    harness.effects[1]();

    if (failureType === 'response') {
      harness.workers[0].emitMessage({ id: 1, error: '解析失败' });
    } else {
      harness.workers[0].emitError('线程失败');
    }

    expect(harness.workers[0].terminate).toHaveBeenCalledTimes(1);
    expect(harness.setWorkerState).toHaveBeenLastCalledWith(expect.objectContaining({
      result: expect.objectContaining({ decoded: '已解码:50000' }),
    }));
  });

  it('线程构造和请求发送异常都走受控降级', () => {
    const constructionFailure = useSchemeViewerDecodeForTest({
      createWorker: () => {
        throw new Error('构造失败');
      },
    });
    constructionFailure.effects[1]();

    const postFailureWorker = createFakeWorker();
    postFailureWorker.postMessage.mockImplementation(() => {
      throw new Error('发送失败');
    });
    const postFailure = useSchemeViewerDecodeForTest({ createWorker: () => postFailureWorker });
    postFailure.effects[1]();

    expect(constructionFailure.setWorkerState).toHaveBeenLastCalledWith(expect.objectContaining({
      result: expect.objectContaining({ decoded: '已解码:50000' }),
    }));
    expect(postFailureWorker.terminate).toHaveBeenCalledTimes(1);
    expect(postFailure.setWorkerState).toHaveBeenLastCalledWith(expect.objectContaining({
      result: expect.objectContaining({ decoded: '已解码:50000' }),
    }));
  });

  it('忽略已被后续请求取代的晚到结果', () => {
    const harness = useSchemeViewerDecodeForTest();
    harness.effects[1]();
    harness.requestIdRef.current = 2;

    harness.workers[0].emitMessage({ id: 1, result: createDecodedResult('late') });

    expect(harness.workers[0].terminate).toHaveBeenCalledTimes(1);
    expect(harness.setWorkerState).toHaveBeenCalledTimes(1);
  });

  it('取消时终止线程并使晚到结果失效', () => {
    const source = 'x'.repeat(50_000);
    const harness = useSchemeViewerDecodeForTest({
      source,
      workerState: { source, result: null, metadata: null, failed: false },
    });
    const cleanup = harness.effects[1]();

    expect(harness.result.cancelDecode()).toBe(true);
    expect(harness.workers[0].terminate).toHaveBeenCalledTimes(1);
    if (typeof cleanup === 'function') cleanup();
    harness.workers[0].emitMessage({ id: 1, result: createDecodedResult('late') });

    expect(harness.requestIdRef.current).toBe(2);
    expect(harness.workers[0].terminate).toHaveBeenCalledTimes(1);
    expect(harness.setCancelledSource).toHaveBeenCalledWith(source);
    expect(harness.setWorkerState).toHaveBeenLastCalledWith({
      source,
      result: null,
      metadata: null,
      failed: false,
    });
  });

  it('输入变化或关闭时清除取消态，清理时不遗留后台线程', () => {
    const changed = useSchemeViewerDecodeForTest({ cancelledSource: '旧输入' });
    changed.effects[0]();
    expect(changed.setCancelledSource).toHaveBeenCalledWith('');

    const closed = useSchemeViewerDecodeForTest({
      cancelledSource: 'x'.repeat(50_000),
      enabled: false,
    });
    closed.effects[0]();
    closed.effects[1]();
    expect(closed.setCancelledSource).toHaveBeenCalledWith('');
    expect(closed.result.isDecodePending).toBe(false);
    expect(closed.workers).toHaveLength(0);

    const opened = useSchemeViewerDecodeForTest();
    const cleanup = opened.effects[1]();
    expect(cleanup).toBeTypeOf('function');
    if (typeof cleanup === 'function') cleanup();
    expect(opened.workers[0].terminate).toHaveBeenCalledTimes(1);
  });
});
