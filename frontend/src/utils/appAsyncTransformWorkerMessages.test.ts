import { describe, expect, it } from 'vitest';
import { TransformMode, type TransformContext } from '../types';
import { buildAppAsyncTransformSnapshot } from './appAsyncTransformSnapshot';
import {
  buildAppAsyncTransformWorkerRequest,
  isAppAsyncTransformWorkerResponse,
} from './appAsyncTransformWorkerMessages';
import { deepParseWithContext } from './transformations';

const createDeepFormatContext = (): TransformContext => ({
  mode: TransformMode.DEEP_FORMAT,
  records: new Map(),
  timestamp: 1,
  originalIndentation: 2,
  sourceFormat: 'json',
  sourceWrapper: { prefix: '', suffix: '' },
  warnings: [],
  unresolvedCandidates: [],
  runtimePlaceholders: [],
});

describe('appAsyncTransformWorkerMessages', () => {
  it('基于异步转换 snapshot 构造 Worker 请求', () => {
    const snapshot = buildAppAsyncTransformSnapshot('{"a":1}', TransformMode.DEEP_FORMAT, true);

    expect(buildAppAsyncTransformWorkerRequest(7, snapshot)).toEqual({
      id: 7,
      input: '{"a":1}',
      mode: TransformMode.DEEP_FORMAT,
      options: { autoExpandScheme: true },
    });
  });

  it('接受普通转换和深度格式化的合法响应', () => {
    expect(isAppAsyncTransformWorkerResponse({
      id: 1,
      output: '{"a":1}',
    }, TransformMode.FORMAT)).toBe(true);
    expect(isAppAsyncTransformWorkerResponse({
      id: 2,
      output: '{"a":1}',
      context: createDeepFormatContext(),
    }, TransformMode.DEEP_FORMAT)).toBe(true);
    expect(isAppAsyncTransformWorkerResponse({
      id: 3,
      output: 'source',
      error: '转换失败',
    }, TransformMode.DEEP_FORMAT)).toBe(true);
  });

  it('接受转换器生成的记录、告警、线索和占位符上下文', () => {
    const nestedContext = deepParseWithContext(JSON.stringify({
      nested: JSON.stringify({ value: 1 }),
    })).context;
    const warningContext = deepParseWithContext(JSON.stringify({
      action_cmd: `cmd=${encodeURIComponent('{"nid":123}')}&padding=${'x'.repeat(80)}`,
    }), { autoExpandScheme: true, maxStringDecodeLength: 20 }).context;
    const unresolvedContext = deepParseWithContext(JSON.stringify({
      tracking: `raw=${encodeURIComponent('{"nid":123}')}`,
    }), { autoExpandScheme: true }).context;
    const schemeContext = deepParseWithContext(
      `baiduboxapp://v7/vendor/ad/makePhoneCall?params=${encodeURIComponent(JSON.stringify({
        pageid: '__TIMESTAMP__',
      }))}`,
      { autoExpandScheme: true },
    ).context;

    expect(nestedContext.records.size).toBeGreaterThan(0);
    expect(warningContext.warnings).toHaveLength(1);
    expect(unresolvedContext.unresolvedCandidates).toHaveLength(1);
    expect(schemeContext.runtimePlaceholders?.length).toBeGreaterThan(0);
    expect(Array.from(schemeContext.records.values()).some(record => (
      record.steps.some(step => step.schemeParamStageSummary !== undefined)
    ))).toBe(true);

    for (const [index, context] of [
      nestedContext,
      warningContext,
      unresolvedContext,
      schemeContext,
    ].entries()) {
      expect(isAppAsyncTransformWorkerResponse({
        id: index + 1,
        output: 'value',
        context,
      }, TransformMode.DEEP_FORMAT)).toBe(true);
    }
  });

  it('拒绝带循环解码值的上下文', () => {
    const cyclicValue: Record<string, unknown> = {};
    cyclicValue.self = cyclicValue;
    const context = {
      ...createDeepFormatContext(),
      records: new Map([['$', {
        path: '$',
        originalValue: 'value',
        steps: [{ type: 'scheme_decode', decodedSchemeValue: cyclicValue }],
      }]]),
    };

    expect(isAppAsyncTransformWorkerResponse({
      id: 1,
      output: 'value',
      context,
    }, TransformMode.DEEP_FORMAT)).toBe(false);
  });

  it.each([
    ['空值', null, TransformMode.FORMAT],
    ['非正整数标识', { id: 0, output: 'value' }, TransformMode.FORMAT],
    ['非字符串输出', { id: 1, output: 1 }, TransformMode.FORMAT],
    ['非字符串错误', { id: 1, output: 'value', error: 1 }, TransformMode.FORMAT],
    ['普通转换携带上下文', {
      id: 1,
      output: 'value',
      context: createDeepFormatContext(),
    }, TransformMode.FORMAT],
    ['深度格式化缺少上下文', {
      id: 1,
      output: 'value',
    }, TransformMode.DEEP_FORMAT],
    ['上下文缺少 Map', {
      id: 1,
      output: 'value',
      context: { ...createDeepFormatContext(), records: {} },
    }, TransformMode.DEEP_FORMAT],
    ['上下文外壳类型错误', {
      id: 1,
      output: 'value',
      context: { ...createDeepFormatContext(), sourceWrapper: { prefix: 1, suffix: '' } },
    }, TransformMode.DEEP_FORMAT],
    ['上下文集合类型错误', {
      id: 1,
      output: 'value',
      context: { ...createDeepFormatContext(), warnings: {} },
    }, TransformMode.DEEP_FORMAT],
    ['上下文记录元素错误', {
      id: 1,
      output: 'value',
      context: { ...createDeepFormatContext(), records: new Map([['$', null]]) },
    }, TransformMode.DEEP_FORMAT],
    ['上下文步骤元素错误', {
      id: 1,
      output: 'value',
      context: {
        ...createDeepFormatContext(),
        records: new Map([['$', { path: '$', originalValue: 'value', steps: [null] }]]),
      },
    }, TransformMode.DEEP_FORMAT],
    ['告警元素错误', {
      id: 1,
      output: 'value',
      context: { ...createDeepFormatContext(), warnings: [null] },
    }, TransformMode.DEEP_FORMAT],
    ['未解析项元素错误', {
      id: 1,
      output: 'value',
      context: { ...createDeepFormatContext(), unresolvedCandidates: [null] },
    }, TransformMode.DEEP_FORMAT],
    ['运行时占位符元素错误', {
      id: 1,
      output: 'value',
      context: { ...createDeepFormatContext(), runtimePlaceholders: [null] },
    }, TransformMode.DEEP_FORMAT],
  ])('拒绝%s', (_name, response, mode) => {
    expect(isAppAsyncTransformWorkerResponse(response, mode)).toBe(false);
  });
});
