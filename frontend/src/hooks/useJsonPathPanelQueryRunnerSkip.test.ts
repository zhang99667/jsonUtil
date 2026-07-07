import { beforeEach, describe, expect, it, vi } from 'vitest';
import { trackToolEvent } from '../utils/productTelemetry';
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

vi.mock('../utils/productTelemetry', async importOriginal => ({
  ...await importOriginal<typeof import('../utils/productTelemetry')>(),
  trackToolEvent: vi.fn(),
}));

const renderRunner = useJsonPathQueryRunnerForTest.bind(null, reactMocks);

describe('useJsonPathPanelQueryRunner skip branches', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    reactMocks.useCallback.mockReset();
    reactMocks.useEffect.mockReset();
    reactMocks.useReducer.mockReset();
    reactMocks.useRef.mockReset();
  });

  it('深度格式化准备中跳过查询且不回写字段快捷输入', () => {
    const { dispatch, input, runner } = renderRunner({
      query: 'traceId',
      isDataPreparing: true,
    });

    runner.handleQuery();

    expect(input.onSetQuery).not.toHaveBeenCalled();
    expect(dispatch).toHaveBeenCalledWith({
      type: 'skipped',
      error: '深度格式化仍在处理，请稍后查询',
    });
    expect(input.createWorker).not.toHaveBeenCalled();
    expect(trackToolEvent).toHaveBeenCalledWith(expect.objectContaining({ status: 'skipped' }));
  });

  it('空查询跳过时清空结果和高亮', () => {
    const { dispatch, input, runner } = renderRunner({ query: '  ' });

    runner.handleQuery();

    expect(dispatch).toHaveBeenCalledWith({
      type: 'skipped',
      error: '请输入 JSONPath 表达式或字段名',
      clearResults: true,
    });
    expect(input.onHighlightRange).toHaveBeenCalledWith(null);
    expect(input.createWorker).not.toHaveBeenCalled();
  });

  it('空 JSON 下字段名快捷输入先同步查询框且不启动 worker', () => {
    const { dispatch, input, runner } = renderRunner({
      query: 'traceId',
      jsonData: '  ',
    });

    runner.handleQuery();

    expect(input.onSetQuery).toHaveBeenCalledWith('$..traceId');
    expect(dispatch).toHaveBeenCalledWith({
      type: 'skipped',
      error: '请先在左侧输入 JSON 数据',
    });
    expect(input.createWorker).not.toHaveBeenCalled();
  });
});
