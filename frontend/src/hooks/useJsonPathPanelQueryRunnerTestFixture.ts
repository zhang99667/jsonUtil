import { vi } from 'vitest';
import type { HighlightRange } from '../types';
import type { JsonPathQueryWorker, JsonPathWorkerResponse } from '../utils/jsonPathPanelQueryWorker';
import { initialJsonPathPanelQueryState } from '../utils/jsonPathPanelQueryState';
import { useJsonPathPanelQueryRunner } from './useJsonPathPanelQueryRunner';

export const range: HighlightRange = { startLine: 1, startColumn: 2, endLine: 1, endColumn: 8 };

export class FakeJsonPathWorker implements JsonPathQueryWorker {
  onmessage: JsonPathQueryWorker['onmessage'] = null;
  onerror: JsonPathQueryWorker['onerror'] = null;
  postMessage = vi.fn();
  terminate = vi.fn();

  emitMessage(data: Parameters<NonNullable<JsonPathQueryWorker['onmessage']>>[0]['data']) {
    this.onmessage?.({ data } as MessageEvent<typeof data>);
  }

  emitError(message = 'boom') {
    this.onerror?.({ message } as ErrorEvent);
  }
}

export const emitJsonPathWorkerSuccess = (
  worker: FakeJsonPathWorker,
  id: number,
  overrides: Partial<JsonPathWorkerResponse> = {}
) => worker.emitMessage({
  id,
  ranges: [range],
  values: ['Ada'],
  items: [{ path: '$.name', pointer: '/name', range, value: 'Ada' }],
  totalResults: 1,
  isLimited: false,
  resultLimit: 1000,
  ...overrides,
});

export interface JsonPathQueryRunnerReactMocks {
  useCallback: ReturnType<typeof vi.fn>;
  useEffect: ReturnType<typeof vi.fn>;
  useReducer: ReturnType<typeof vi.fn>;
  useRef: ReturnType<typeof vi.fn>;
}

const createDefaultInput = (overrides: Partial<Parameters<typeof useJsonPathPanelQueryRunner>[0]> = {}) => ({
  query: '$.name',
  jsonData: '{"name":"Ada"}',
  deepFormat: true,
  autoExpandScheme: true,
  isDataPreparing: false,
  externalQueryRequest: null,
  isOpen: true,
  onSetQuery: vi.fn(),
  onAddHistoryItem: vi.fn(),
  onHighlightRange: vi.fn(),
  createWorker: vi.fn(() => new FakeJsonPathWorker()),
  ...overrides,
});

export const useJsonPathQueryRunnerForTest = (
  reactMocks: JsonPathQueryRunnerReactMocks,
  inputOverrides: Partial<Parameters<typeof useJsonPathPanelQueryRunner>[0]> = {},
  stateOverrides: Partial<typeof initialJsonPathPanelQueryState> = {}
) => {
  const cleanups: Array<() => void> = [];
  const dispatch = vi.fn();
  reactMocks.useCallback.mockImplementation((callback: unknown) => callback);
  reactMocks.useEffect.mockImplementation((effect: () => void | (() => void)) => {
    const cleanup = effect();
    if (typeof cleanup === 'function') cleanups.push(cleanup);
  });
  reactMocks.useReducer.mockReturnValue([{ ...initialJsonPathPanelQueryState, ...stateOverrides }, dispatch]);
  reactMocks.useRef.mockImplementation((initialValue: unknown) => ({ current: initialValue }));

  const input = createDefaultInput(inputOverrides);
  const runner = useJsonPathPanelQueryRunner(input);
  const workers = () => vi.mocked(input.createWorker).mock.results.map(result => result.value as FakeJsonPathWorker);
  dispatch.mockClear();
  (input.onHighlightRange as ReturnType<typeof vi.fn>).mockClear();

  return { cleanups, dispatch, input, runner, workers };
};
