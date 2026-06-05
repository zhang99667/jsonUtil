import { describe, expect, it } from 'vitest';
import { isFiniteNumber, isRecord, parseJsonWithFallback } from './storage';

describe('parseJsonWithFallback', () => {
  it('解析合法 JSON', () => {
    expect(parseJsonWithFallback('{"enabled":true}', { enabled: false })).toEqual({ enabled: true });
  });

  it('空值或损坏 JSON 返回默认值', () => {
    const fallback = { enabled: false };

    expect(parseJsonWithFallback(null, fallback)).toBe(fallback);
    expect(parseJsonWithFallback('{bad', fallback)).toBe(fallback);
  });

  it('结构校验失败时返回默认值', () => {
    const fallback = { enabled: false };

    expect(parseJsonWithFallback('null', fallback, isRecord)).toBe(fallback);
  });
});

describe('storage guards', () => {
  it('识别普通对象', () => {
    expect(isRecord({ a: 1 })).toBe(true);
    expect(isRecord(null)).toBe(false);
    expect(isRecord([])).toBe(false);
  });

  it('识别有限数字', () => {
    expect(isFiniteNumber(1)).toBe(true);
    expect(isFiniteNumber(Number.NaN)).toBe(false);
  });
});
