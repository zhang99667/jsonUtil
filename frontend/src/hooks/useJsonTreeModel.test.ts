import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import type { JsonTreeModel } from '../utils/jsonTreeModel';
import type {
  JsonTreeWorker,
  JsonTreeWorkerResponse,
} from '../utils/jsonTreeWorker';
import { useJsonTreeModel, type JsonTreeModelState } from './useJsonTreeModel';

const reactMocks = vi.hoisted(() => ({
  useEffect: vi.fn(),
  useRef: vi.fn(),
  useState: vi.fn(),
}));

vi.mock('react', async importOriginal => ({
  ...await importOriginal<typeof import('react')>(),
  ...reactMocks,
}));

interface FakeJsonTreeWorker extends JsonTreeWorker {
  postMessage: Mock<JsonTreeWorker['postMessage']>;
  terminate: Mock<JsonTreeWorker['terminate']>;
  emitMessage(response: JsonTreeWorkerResponse): void;
  emitError(message: string): void;
}

interface RenderHookOptions {
  createWorker?: () => JsonTreeWorker;
  enabled?: boolean;
  existingWorker?: JsonTreeWorker | null;
  jsonData?: string;
  requestId?: number;
}

const EMPTY_STATE: JsonTreeModelState = {
  model: null,
  error: '',
  isLoading: false,
};

const MODEL: JsonTreeModel = {
  nodes: [],
  totalNodes: 0,
  isLimited: false,
  maxNodes: 10_000,
  maxDepth: 100,
};

const createFakeWorker = (): FakeJsonTreeWorker => {
  const worker: FakeJsonTreeWorker = {
    onmessage: null,
    onerror: null,
    postMessage: vi.fn(),
    terminate: vi.fn(),
    emitMessage: response => {
      worker.onmessage?.({ data: response } as MessageEvent<JsonTreeWorkerResponse>);
    },
    emitError: message => {
      worker.onerror?.({ message } as ErrorEvent);
    },
  };
  return worker;
};

const useJsonTreeModelForTest = ({
  createWorker,
  enabled = true,
  existingWorker = null,
  jsonData = '{"name":"JSONUtils"}',
  requestId = 0,
}: RenderHookOptions = {}) => {
  const effects: Array<() => void | (() => void)> = [];
  const setModelState = vi.fn();
  const workerRef = { current: existingWorker };
  const requestIdRef = { current: requestId };
  const workers: FakeJsonTreeWorker[] = [];
  const workerFactory = createWorker ?? (() => {
    const worker = createFakeWorker();
    workers.push(worker);
    return worker;
  });

  reactMocks.useRef
    .mockImplementationOnce(() => workerRef)
    .mockImplementationOnce(() => requestIdRef);
  reactMocks.useState.mockImplementationOnce(() => [EMPTY_STATE, setModelState]);
  reactMocks.useEffect.mockImplementation(effect => effects.push(effect));

  useJsonTreeModel(jsonData, { createWorker: workerFactory, enabled });
  return { effects, requestIdRef, setModelState, workers };
};

describe('useJsonTreeModel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.values(reactMocks).forEach(mock => mock.mockReset());
  });

  it('禁用或空输入时清理旧线程并返回空闲态', () => {
    const existingWorker = createFakeWorker();
    const harness = useJsonTreeModelForTest({ enabled: false, existingWorker });

    harness.effects[0]();

    expect(existingWorker.terminate).toHaveBeenCalledTimes(1);
    expect(harness.setModelState).toHaveBeenCalledWith(EMPTY_STATE);
    expect(harness.requestIdRef.current).toBe(1);
  });

  it('只接收标识匹配且包含模型的成功响应', () => {
    const harness = useJsonTreeModelForTest();
    harness.effects[0]();

    harness.workers[0].emitMessage({ id: 1, model: MODEL });

    expect(harness.workers[0].terminate).toHaveBeenCalledTimes(1);
    expect(harness.setModelState).toHaveBeenLastCalledWith({
      model: MODEL,
      error: '',
      isLoading: false,
    });
  });

  it('线程构造失败时进入中文失败态且不向 effect 逸出', () => {
    const harness = useJsonTreeModelForTest({
      createWorker: () => {
        throw new Error('构造失败');
      },
    });

    expect(() => harness.effects[0]()).not.toThrow();
    expect(harness.setModelState).toHaveBeenLastCalledWith({
      model: null,
      error: 'JSON 结构解析失败: 构造失败',
      isLoading: false,
    });
  });

  it('请求发送失败时终止线程并进入失败态', () => {
    const worker = createFakeWorker();
    worker.postMessage.mockImplementation(() => {
      throw new Error('发送失败');
    });
    const harness = useJsonTreeModelForTest({ createWorker: () => worker });

    expect(() => harness.effects[0]()).not.toThrow();
    expect(worker.terminate).toHaveBeenCalledTimes(1);
    expect(harness.setModelState).toHaveBeenLastCalledWith({
      model: null,
      error: 'JSON 结构解析失败: 发送失败',
      isLoading: false,
    });
  });

  it.each([
    [{ id: 99, model: MODEL }, '后台线程响应标识不匹配'],
    [{ id: 1, model: null }, '后台线程未返回结构数据'],
    [{ id: 1, model: null, error: 'JSON 语法错误' }, 'JSON 语法错误'],
  ] as const)('无效响应会结束加载并释放线程', (response, message) => {
    const harness = useJsonTreeModelForTest();
    harness.effects[0]();

    harness.workers[0].emitMessage(response);

    expect(harness.workers[0].terminate).toHaveBeenCalledTimes(1);
    expect(harness.setModelState).toHaveBeenLastCalledWith({
      model: null,
      error: `JSON 结构解析失败: ${message}`,
      isLoading: false,
    });
  });

  it('成功后的迟到错误和重复消息不能覆盖首个终态', () => {
    const harness = useJsonTreeModelForTest();
    harness.effects[0]();

    harness.workers[0].emitMessage({ id: 1, model: MODEL });
    harness.workers[0].emitError('迟到错误');
    harness.workers[0].emitMessage({ id: 1, model: null, error: '重复失败' });

    expect(harness.workers[0].terminate).toHaveBeenCalledTimes(1);
    expect(harness.setModelState).toHaveBeenCalledTimes(2);
    expect(harness.setModelState).toHaveBeenLastCalledWith({
      model: MODEL,
      error: '',
      isLoading: false,
    });
  });

  it('失败后的迟到成功不能覆盖首个终态', () => {
    const harness = useJsonTreeModelForTest();
    harness.effects[0]();

    harness.workers[0].emitError('线程失败');
    harness.workers[0].emitMessage({ id: 1, model: MODEL });

    expect(harness.workers[0].terminate).toHaveBeenCalledTimes(1);
    expect(harness.setModelState).toHaveBeenCalledTimes(2);
    expect(harness.setModelState).toHaveBeenLastCalledWith({
      model: null,
      error: 'JSON 结构解析失败: 线程失败',
      isLoading: false,
    });
  });

  it('清理后的消息和错误不会再写状态或重复终止线程', () => {
    const harness = useJsonTreeModelForTest();
    const cleanup = harness.effects[0]();
    expect(cleanup).toBeTypeOf('function');

    if (typeof cleanup === 'function') cleanup();
    harness.workers[0].emitMessage({ id: 1, model: MODEL });
    harness.workers[0].emitError('迟到错误');

    expect(harness.workers[0].terminate).toHaveBeenCalledTimes(1);
    expect(harness.setModelState).toHaveBeenCalledTimes(1);
  });
});
