import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import type { SchemeLocation, SchemeScanResult } from '../utils/schemeScanner';
import type {
  SchemeScanWorker,
  SchemeScanWorkerResponse,
} from '../utils/schemeScanWorker';
import { useEditorSchemeScan } from './useEditorSchemeScan';

const reactMocks = vi.hoisted(() => ({
  useEffect: vi.fn(),
  useLayoutEffect: vi.fn(),
  useRef: vi.fn(),
  useState: vi.fn(),
}));

const scanMocks = vi.hoisted(() => ({
  scanSchemesInJson: vi.fn(),
}));

vi.mock('react', async importOriginal => ({
  ...await importOriginal<typeof import('react')>(),
  ...reactMocks,
}));

vi.mock('../utils/schemeScanner', async importOriginal => ({
  ...await importOriginal<typeof import('../utils/schemeScanner')>(),
  scanSchemesInJson: scanMocks.scanSchemesInJson,
}));

interface FakeSchemeScanWorker extends SchemeScanWorker {
  postMessage: Mock<SchemeScanWorker['postMessage']>;
  terminate: Mock<SchemeScanWorker['terminate']>;
}

interface ScanState {
  source: string;
  locations: SchemeLocation[];
  warning: string;
}

interface RenderOptions {
  value?: string;
  enabled?: boolean;
  scanState?: ScanState;
  locationsRefValue?: SchemeLocation[];
  requestId?: number;
  createWorker?: () => SchemeScanWorker;
}

const CURRENT_VALUE = '{"current":true}';
const FAILURE_WARNING = 'Scheme 扫描失败，已跳过本次结果';

const createLocation = (value = 'app://current'): SchemeLocation => ({
  path: '$.url',
  pointer: '/url',
  line: 1,
  column: 8,
  endLine: 1,
  endColumn: 23,
  value,
  schemeType: 'url',
});

const createScanResult = (locations = [createLocation()]): SchemeScanResult => ({
  locations,
  isLimited: false,
  limit: 1000,
});

const createFakeWorker = (): FakeSchemeScanWorker => ({
  onmessage: null,
  onerror: null,
  postMessage: vi.fn(),
  terminate: vi.fn(),
});

const useEditorSchemeScanForTest = ({
  value = CURRENT_VALUE,
  enabled = true,
  scanState = { source: '', locations: [], warning: '' },
  locationsRefValue = [],
  requestId = 0,
  createWorker,
}: RenderOptions = {}) => {
  const effects: Array<() => void | (() => void)> = [];
  const layoutEffects: Array<() => void | (() => void)> = [];
  const setScanState = vi.fn();
  const locationsRef = { current: locationsRefValue };
  const sourceRef = { current: scanState.source };
  const requestIdRef = { current: requestId };

  reactMocks.useState.mockReturnValue([scanState, setScanState]);
  reactMocks.useRef.mockImplementation((initialValue: unknown) => (
    typeof initialValue === 'number'
      ? requestIdRef
      : (Array.isArray(initialValue) ? locationsRef : sourceRef)
  ));
  reactMocks.useEffect.mockImplementation(effect => effects.push(effect));
  reactMocks.useLayoutEffect.mockImplementation(effect => layoutEffects.push(effect));

  const result = useEditorSchemeScan(value, { enabled, createWorker });
  return {
    effects,
    layoutEffects,
    locationsRef,
    requestIdRef,
    result,
    setScanState,
    sourceRef,
  };
};

const useWorkerScanForTest = (worker = createFakeWorker()) => {
  const harness = useEditorSchemeScanForTest({
    value: 'x'.repeat(200_000),
    createWorker: () => worker,
  });
  const cleanup = harness.effects[0]();
  vi.advanceTimersByTime(500);
  return { cleanup, harness, worker };
};

describe('useEditorSchemeScan', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    Object.values(reactMocks).forEach(mock => mock.mockReset());
    scanMocks.scanSchemesInJson.mockReturnValue(createScanResult());
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('新输入首帧立即隐藏旧结果、警告和点击位置', () => {
    const oldLocation = createLocation('app://old');
    const harness = useEditorSchemeScanForTest({
      scanState: {
        source: '{"old":"app://old"}',
        locations: [oldLocation],
        warning: '旧结果已截断',
      },
      locationsRefValue: [oldLocation],
    });

    expect(harness.result.schemeLocations).toEqual([]);
    expect(harness.result.schemeScanWarning).toBe('');
    harness.layoutEffects[0]?.();
    expect(harness.locationsRef.current).toEqual([]);
    expect(harness.sourceRef.current).toBe('');
    expect(scanMocks.scanSchemesInJson).not.toHaveBeenCalled();
  });

  it('防抖结束后提交与当前输入绑定的同步扫描结果', () => {
    const result = createScanResult();
    scanMocks.scanSchemesInJson.mockReturnValue(result);
    const harness = useEditorSchemeScanForTest();

    harness.effects[0]();
    vi.advanceTimersByTime(499);
    expect(scanMocks.scanSchemesInJson).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);

    expect(harness.setScanState).toHaveBeenCalledWith({
      source: CURRENT_VALUE,
      locations: result.locations,
      warning: '',
    });
  });

  it.each(['构造', '发送'] as const)('Worker %s异常时进入当前输入的受控空终态', failureType => {
    const worker = createFakeWorker();
    if (failureType === '发送') {
      worker.postMessage.mockImplementation(() => {
        throw new Error('发送失败');
      });
    }
    const harness = useEditorSchemeScanForTest({
      value: 'x'.repeat(200_000),
      createWorker: failureType === '构造'
        ? () => { throw new Error('构造失败'); }
        : () => worker,
    });

    harness.effects[0]();
    expect(() => vi.advanceTimersByTime(500)).not.toThrow();
    expect(harness.setScanState).toHaveBeenLastCalledWith({
      source: 'x'.repeat(200_000),
      locations: [],
      warning: FAILURE_WARNING,
    });
    expect(worker.terminate).toHaveBeenCalledTimes(failureType === '发送' ? 1 : 0);
  });

  const invalidResponses: Array<[string, unknown]> = [
    ['错误标识', { id: 99, ...createScanResult() }],
    ['畸形结构', { id: 1, locations: null, isLimited: false, limit: 1000 }],
    ['非法位置', { id: 1, ...createScanResult([{ ...createLocation(), line: 0 }]) }],
    ['非法协议类型', {
      id: 1,
      locations: [{ ...createLocation(), schemeType: 'unknown' }],
      isLimited: false,
      limit: 1000,
    }],
    ['空错误字段', { id: 1, locations: [], isLimited: false, limit: 0, error: '' }],
  ];

  it.each(invalidResponses)('%s响应只提交受控空终态', (_label, response) => {
    const { harness, worker } = useWorkerScanForTest();
    const onmessage = worker.onmessage;

    onmessage?.({ data: response } as MessageEvent<unknown>);
    onmessage?.({ data: { id: 1, ...createScanResult() } } as MessageEvent<SchemeScanWorkerResponse>);

    expect(worker.terminate).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
    expect(harness.setScanState).toHaveBeenCalledTimes(1);
    expect(harness.setScanState).toHaveBeenCalledWith(expect.objectContaining({
      locations: [],
      warning: FAILURE_WARNING,
    }));
  });

  it('运行错误先到时忽略已排队的成功响应', () => {
    const { harness, worker } = useWorkerScanForTest();
    const onmessage = worker.onmessage;
    const onerror = worker.onerror;

    onerror?.({ message: '运行失败' } as ErrorEvent);
    onmessage?.({ data: { id: 1, ...createScanResult() } } as MessageEvent<SchemeScanWorkerResponse>);

    expect(worker.terminate).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
    expect(harness.setScanState).toHaveBeenCalledTimes(1);
    const failureState = harness.setScanState.mock.calls[0]?.[0];
    expect(failureState?.locations).toEqual([]);
    expect(failureState?.warning).toBe(FAILURE_WARNING);
  });

  it('成功先到时忽略重复消息和迟到错误', () => {
    const firstResult = createScanResult([createLocation('app://first')]);
    const { harness, worker } = useWorkerScanForTest();
    const onmessage = worker.onmessage;
    const onerror = worker.onerror;

    onmessage?.({ data: { id: 1, ...firstResult } } as MessageEvent<SchemeScanWorkerResponse>);
    onmessage?.({ data: { id: 1, ...createScanResult([createLocation('app://second')]) } } as MessageEvent<SchemeScanWorkerResponse>);
    onerror?.({ message: '迟到错误' } as ErrorEvent);

    expect(worker.terminate).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
    expect(harness.setScanState).toHaveBeenCalledTimes(1);
    expect(harness.setScanState).toHaveBeenCalledWith(expect.objectContaining({
      locations: firstResult.locations,
      warning: '',
    }));
  });

  it('Worker 发送时同步完成后不再创建超时计时器', () => {
    const worker = createFakeWorker();
    worker.postMessage.mockImplementation(request => {
      worker.onmessage?.({
        data: { id: request.id, ...createScanResult() },
      } as MessageEvent<SchemeScanWorkerResponse>);
    });
    const { harness } = useWorkerScanForTest(worker);

    vi.advanceTimersByTime(10_000);
    expect(vi.getTimerCount()).toBe(0);
    expect(worker.terminate).toHaveBeenCalledTimes(1);
    expect(harness.setScanState).toHaveBeenCalledTimes(1);
    expect(harness.setScanState.mock.calls[0]?.[0]?.warning).toBe('');
  });

  it('Worker 十秒未回复时终止并忽略迟到成功响应', () => {
    const { harness, worker } = useWorkerScanForTest();
    const onmessage = worker.onmessage;

    vi.advanceTimersByTime(9_999);
    expect(harness.setScanState).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    onmessage?.({ data: { id: 1, ...createScanResult() } } as MessageEvent<SchemeScanWorkerResponse>);

    expect(worker.terminate).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
    expect(harness.setScanState).toHaveBeenCalledTimes(1);
    const timeoutState = harness.setScanState.mock.calls[0]?.[0];
    expect(timeoutState?.locations).toEqual([]);
    expect(timeoutState?.warning).toBe(FAILURE_WARNING);
  });

  it('后续请求接管后忽略旧 Worker 响应', () => {
    const { harness, worker } = useWorkerScanForTest();
    const onmessage = worker.onmessage;
    harness.requestIdRef.current += 1;

    onmessage?.({ data: { id: 1, ...createScanResult() } } as MessageEvent<SchemeScanWorkerResponse>);

    expect(worker.terminate).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
    expect(harness.setScanState).not.toHaveBeenCalled();
  });

  it('清理后忽略已排队回调并保持幂等终止', () => {
    const { cleanup, harness, worker } = useWorkerScanForTest();
    const onmessage = worker.onmessage;
    const onerror = worker.onerror;

    if (typeof cleanup === 'function') cleanup();
    vi.advanceTimersByTime(10_000);
    onmessage?.({ data: { id: 1, ...createScanResult() } } as MessageEvent<SchemeScanWorkerResponse>);
    onerror?.({ message: '迟到错误' } as ErrorEvent);

    expect(worker.terminate).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
    expect(harness.setScanState).not.toHaveBeenCalled();
  });
});
