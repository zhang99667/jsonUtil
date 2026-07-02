import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TransformMode, type TransformContext } from '../types';
import { ASYNC_TRANSFORM_PLACEHOLDER } from './appAsyncPolicy';
import type { AppAsyncTransformResult } from './appAsyncTransformState';
import { buildAppTransformOutputState } from './appTransformOutput';
import { deepParseWithContext, performTransform } from './transformations';

vi.mock('./transformations', () => ({
  deepParseWithContext: vi.fn(),
  performTransform: vi.fn(() => 'fallback-output'),
}));

const createContext = (warnings: TransformContext['warnings'] = []): TransformContext => ({
  mode: TransformMode.DEEP_FORMAT,
  records: new Map(),
  warnings,
  timestamp: 1,
  originalIndentation: 2,
});

type TransformOutputInput = Parameters<typeof buildAppTransformOutputState>[0];
const buildOutputState = (overrides: Partial<TransformOutputInput> = {}) => (
  buildAppTransformOutputState({
    input: '{"a":1}',
    mode: TransformMode.FORMAT,
    autoExpandScheme: false,
    shouldUseAsyncTransform: false,
    currentAsyncTransformResult: null,
    isUpdatingFromOutput: false,
    pendingOutputValue: '',
    ...overrides,
  })
);

describe('appTransformOutput', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(performTransform).mockReturnValue('fallback-output');
  });

  it('同步深度格式化时输出 deep parse 结果、诊断文案和报告 context', () => {
    const context = createContext([{
      type: 'string_decode_budget_exceeded',
      path: '$.data',
      message: '超过递归展开上限',
      length: 2048,
      limit: 1024,
      originalValue: '...',
    }]);
    vi.mocked(deepParseWithContext).mockReturnValue({
      output: 'deep-output',
      context,
    });

    const state = buildOutputState({
      input: '{"data":"..."}',
      mode: TransformMode.DEEP_FORMAT,
      autoExpandScheme: true,
    });

    expect(deepParseWithContext).toHaveBeenCalledWith('{"data":"..."}', { autoExpandScheme: true });
    expect(performTransform).not.toHaveBeenCalled();
    expect(state.output).toBe('deep-output');
    expect(state.activeDeepFormatResult).toEqual({ output: 'deep-output', context });
    expect(state.transformReportContext).toBe(context);
    expect(state.deepFormatWarning).toBe('超过递归展开上限: $.data (2048 字符，阈值 1024)');
    expect(state.deepFormatInfo).toBe('深度解析: 展开 0 处，跳过 1');
    expect(state.shouldClearPendingOutput).toBe(true);
  });

  it.each([
    ['正在回写', '{"a":2}', '{"a":2}'],
    ['被删空', '', ''],
  ])('PREVIEW %s时优先展示草稿且不清空暂存', (_, pendingOutputValue, expectedOutput) => {
    const state = buildOutputState({
      isUpdatingFromOutput: true,
      pendingOutputValue,
    });

    expect(performTransform).not.toHaveBeenCalled();
    expect(state.output).toBe(expectedOutput);
    expect(state.shouldClearPendingOutput).toBe(false);
  });

  it('异步深度格式化结果带 context 时优先作为 active deep result', () => {
    const context = createContext();
    const currentAsyncTransformResult: AppAsyncTransformResult = {
      input: '{"a":1}',
      mode: TransformMode.DEEP_FORMAT,
      autoExpandScheme: true,
      output: 'async-deep-output',
      context,
    };

    const state = buildOutputState({
      mode: TransformMode.DEEP_FORMAT,
      autoExpandScheme: true,
      shouldUseAsyncTransform: true,
      currentAsyncTransformResult,
    });

    expect(deepParseWithContext).not.toHaveBeenCalled();
    expect(performTransform).not.toHaveBeenCalled();
    expect(state.output).toBe('async-deep-output');
    expect(state.activeDeepFormatResult).toEqual({ output: 'async-deep-output', context });
    expect(state.transformReportContext).toBe(context);
    expect(state.shouldClearPendingOutput).toBe(true);
  });

  it('异步转换未完成时展示占位并保留 PREVIEW 暂存', () => {
    const state = buildOutputState({
      mode: TransformMode.JSON_TO_TYPESCRIPT,
      shouldUseAsyncTransform: true,
    });

    expect(performTransform).not.toHaveBeenCalled();
    expect(state.output).toBe(ASYNC_TRANSFORM_PLACEHOLDER);
    expect(state.shouldClearPendingOutput).toBe(false);
  });

  it('普通转换模式回退到同步转换结果并清理暂存', () => {
    const state = buildOutputState({
      mode: TransformMode.MINIFY,
    });

    expect(performTransform).toHaveBeenCalledWith('{"a":1}', TransformMode.MINIFY);
    expect(state.output).toBe('fallback-output');
    expect(state.transformReportContext).toBeNull();
    expect(state.shouldClearPendingOutput).toBe(true);
  });
});
