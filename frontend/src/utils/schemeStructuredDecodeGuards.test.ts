import { describe, expect, it } from 'vitest';
import {
  buildSchemeStructuredDecodeWarnings,
  createSchemeStructuredDecodeState,
  shouldSkipSchemeStructuredStringDecode,
} from './schemeStructuredDecodeGuards';

describe('schemeStructuredDecodeGuards', () => {
  it('累计可解码字符串长度和次数', () => {
    const state = createSchemeStructuredDecodeState();

    expect(shouldSkipSchemeStructuredStringDecode('cmd=%7B%7D', '$.cmd', state)).toBe(false);
    expect(state.decodedStringCount).toBe(1);
    expect(state.totalStringDecodeLength).toBe('cmd=%7B%7D'.length);
    expect(buildSchemeStructuredDecodeWarnings(state)).toBeUndefined();
  });

  it('超过单字段或总长度预算时记录跳过路径', () => {
    const state = createSchemeStructuredDecodeState();
    state.maxStringDecodeLength = 10;

    expect(shouldSkipSchemeStructuredStringDecode('x'.repeat(11), '$.long', state)).toBe(true);
    expect(buildSchemeStructuredDecodeWarnings(state)).toEqual([
      {
        type: 'json_string_decode_skipped',
        message: '部分 JSON 字符串因性能保护未递归展开，可复制对应字段单独解析',
        skippedCount: 1,
        decodedStringCount: 0,
        totalStringLength: 0,
        limit: state.maxTotalStringDecodeLength,
        paths: ['$.long'],
      },
    ]);
  });

  it('限制警告中的路径样本数量', () => {
    const state = createSchemeStructuredDecodeState();
    state.maxStringDecodeLength = 1;

    Array.from({ length: 12 }).forEach((_, index) => {
      shouldSkipSchemeStructuredStringDecode('xx', `$.items[${index}]`, state);
    });

    const warnings = buildSchemeStructuredDecodeWarnings(state);
    expect(warnings?.[0].skippedCount).toBe(12);
    expect(warnings?.[0].paths).toHaveLength(8);
  });
});
