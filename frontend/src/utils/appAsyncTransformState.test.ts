import { describe, expect, it } from 'vitest';
import { TransformMode, type TransformContext, type TransformResult } from '../types';
import { ASYNC_TRANSFORM_PLACEHOLDER } from './appAsyncPolicy';
import { buildAppAsyncTransformSnapshot } from './appAsyncTransformSnapshot';
import {
  buildAppAsyncTransformFallbackResult,
  buildAppAsyncTransformResult,
  getActiveAppDeepFormatResult,
  getFreshAppAsyncTransformResult,
  resolveAppOutputValue,
  type AppAsyncTransformResult,
} from './appAsyncTransformState';

const createContext = (): TransformContext => ({
  mode: TransformMode.DEEP_FORMAT,
  records: new Map(),
  warnings: [],
  timestamp: 1,
  originalIndentation: 2,
});

const asyncSnapshot = buildAppAsyncTransformSnapshot('{"a":1}', TransformMode.DEEP_FORMAT, true);

const asyncResult: AppAsyncTransformResult = {
  ...asyncSnapshot,
  output: '{\n  "a": 1\n}',
  context: createContext(),
};

describe('appAsyncTransformState', () => {
  it('统一构造异步转换成功结果和 fallback 结果', () => {
    const context = createContext();

    expect(buildAppAsyncTransformResult({
      snapshot: asyncSnapshot,
      output: 'formatted',
      context,
    })).toEqual({
      input: '{"a":1}',
      mode: TransformMode.DEEP_FORMAT,
      autoExpandScheme: true,
      output: 'formatted',
      context,
    });
    expect(buildAppAsyncTransformResult({
      snapshot: buildAppAsyncTransformSnapshot('{"a":1}', TransformMode.FORMAT, false),
      output: 'formatted',
    })).toEqual({
      input: '{"a":1}',
      mode: TransformMode.FORMAT,
      autoExpandScheme: false,
      output: 'formatted',
    });
    expect(buildAppAsyncTransformFallbackResult(
      buildAppAsyncTransformSnapshot('raw', TransformMode.MINIFY, false)
    )).toEqual({
      input: 'raw',
      mode: TransformMode.MINIFY,
      autoExpandScheme: false,
      output: 'raw',
    });
  });

  it('只复用 input、mode 和 autoExpandScheme 都匹配的异步结果', () => {
    expect(getFreshAppAsyncTransformResult(
      asyncResult,
      asyncSnapshot
    )).toBe(asyncResult);
    expect(getFreshAppAsyncTransformResult(
      asyncResult,
      buildAppAsyncTransformSnapshot('{"a":2}', TransformMode.DEEP_FORMAT, true)
    )).toBeNull();
    expect(getFreshAppAsyncTransformResult(
      asyncResult,
      buildAppAsyncTransformSnapshot('{"a":1}', TransformMode.DEEP_FORMAT, false)
    )).toBeNull();
  });

  it('优先使用同步深度格式化结果，否则复用带 context 的异步结果', () => {
    const syncResult: TransformResult = {
      output: 'sync',
      context: createContext(),
    };

    expect(getActiveAppDeepFormatResult(syncResult, TransformMode.DEEP_FORMAT, asyncResult)).toBe(syncResult);
    expect(getActiveAppDeepFormatResult(null, TransformMode.DEEP_FORMAT, asyncResult)).toEqual({
      output: asyncResult.output,
      context: asyncResult.context,
    });
    expect(getActiveAppDeepFormatResult(null, TransformMode.FORMAT, asyncResult)).toBeNull();
  });

  it('解析输出值并标记何时清理 PREVIEW 暂存输出', () => {
    expect(resolveAppOutputValue({
      isUpdatingFromOutput: true,
      pendingOutputValue: 'user editing',
      mode: TransformMode.FORMAT,
      activeDeepFormatResult: null,
      shouldUseAsyncTransform: false,
      currentAsyncTransformResult: null,
      getFallbackOutput: () => 'fallback',
    })).toEqual({
      output: 'user editing',
      shouldClearPendingOutput: false,
    });

    expect(resolveAppOutputValue({
      isUpdatingFromOutput: false,
      pendingOutputValue: '',
      mode: TransformMode.DEEP_FORMAT,
      activeDeepFormatResult: {
        output: 'deep',
        context: createContext(),
      },
      shouldUseAsyncTransform: false,
      currentAsyncTransformResult: null,
      getFallbackOutput: () => 'fallback',
    })).toEqual({
      output: 'deep',
      shouldClearPendingOutput: true,
    });

    expect(resolveAppOutputValue({
      isUpdatingFromOutput: false,
      pendingOutputValue: '',
      mode: TransformMode.FORMAT,
      activeDeepFormatResult: null,
      shouldUseAsyncTransform: true,
      currentAsyncTransformResult: null,
      getFallbackOutput: () => 'fallback',
    })).toEqual({
      output: ASYNC_TRANSFORM_PLACEHOLDER,
      shouldClearPendingOutput: false,
    });

    expect(resolveAppOutputValue({
      isUpdatingFromOutput: false,
      pendingOutputValue: '',
      mode: TransformMode.FORMAT,
      activeDeepFormatResult: null,
      shouldUseAsyncTransform: false,
      currentAsyncTransformResult: null,
      getFallbackOutput: () => 'fallback',
    })).toEqual({
      output: 'fallback',
      shouldClearPendingOutput: true,
    });
  });

  it('异步占位和深度格式化命中时不执行 fallback 转换', () => {
    let fallbackCalls = 0;
    const getFallbackOutput = () => {
      fallbackCalls += 1;
      return 'fallback';
    };

    resolveAppOutputValue({
      isUpdatingFromOutput: false,
      pendingOutputValue: '',
      mode: TransformMode.FORMAT,
      activeDeepFormatResult: null,
      shouldUseAsyncTransform: true,
      currentAsyncTransformResult: null,
      getFallbackOutput,
    });
    resolveAppOutputValue({
      isUpdatingFromOutput: false,
      pendingOutputValue: '',
      mode: TransformMode.DEEP_FORMAT,
      activeDeepFormatResult: {
        output: 'deep',
        context: createContext(),
      },
      shouldUseAsyncTransform: false,
      currentAsyncTransformResult: null,
      getFallbackOutput,
    });

    expect(fallbackCalls).toBe(0);
  });
});
