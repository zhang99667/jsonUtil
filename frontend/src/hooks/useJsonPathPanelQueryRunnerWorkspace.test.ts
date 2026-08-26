import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useJsonPathQueryRunnerForTest } from './useJsonPathPanelQueryRunnerTestFixture';

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

const renderRunner = useJsonPathQueryRunnerForTest.bind(null, reactMocks);

describe('useJsonPathPanelQueryRunner 文件工作区', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    reactMocks.useCallback.mockReset();
    reactMocks.useEffect.mockReset();
    reactMocks.useReducer.mockReset();
    reactMocks.useRef.mockReset();
  });

  it('只在外部 JSONPath 请求所属的文件工作区执行查询', () => {
    const ignored = renderRunner({
      workspaceId: 'file-b',
      externalQueryRequest: { id: 7, query: '$.target', workspaceId: 'file-a' },
    });

    expect(ignored.input.onSetQuery).not.toHaveBeenCalled();
    expect(ignored.input.createWorker).not.toHaveBeenCalled();

    const accepted = renderRunner({
      workspaceId: 'file-a',
      externalQueryRequest: { id: 7, query: '$.target', workspaceId: 'file-a' },
    });

    expect(accepted.input.onSetQuery).toHaveBeenCalledWith('$.target');
    expect(accepted.input.createWorker).toHaveBeenCalledTimes(1);
  });
});
