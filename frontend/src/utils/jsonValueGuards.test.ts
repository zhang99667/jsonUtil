import { describe, expect, it } from 'vitest';
import type { JsonValue } from '../types';
import { isJsonObject, isJsonValue, parseJsonValue, tryParseJsonValue } from './jsonValueGuards';

describe('jsonValueGuards', () => {
  it('只接受 JSON 对象节点', () => {
    const values: JsonValue[] = [{ ok: true }, [], null, 'text', 1, false];

    expect(values.map(isJsonObject)).toEqual([true, false, false, false, false, false]);
  });

  it('接受标量、容器和非循环的共享引用', () => {
    const shared = { ok: true };

    expect(isJsonValue({ left: shared, right: shared, values: [null, 'text', 1, false] })).toBe(true);
    expect(isJsonValue(Object.assign(Object.create(null), { value: 1 }))).toBe(true);
  });

  it('拒绝非 JSON 值、稀疏数组与循环引用', () => {
    const cyclic: Record<string, unknown> = {};
    cyclic.self = cyclic;

    expect([
      undefined,
      Number.NaN,
      Number.POSITIVE_INFINITY,
      1n,
      new Date(0),
      new Array(1),
      cyclic,
    ].map(isJsonValue)).toEqual([false, false, false, false, false, false, false]);
  });

  it('迭代处理深层对象而不依赖调用栈', () => {
    const root: Record<string, unknown> = {};
    let current = root;
    for (let depth = 0; depth < 10_000; depth += 1) {
      const child: Record<string, unknown> = {};
      current.child = child;
      current = child;
    }

    expect(isJsonValue(root)).toBe(true);
  });

  it('解析合法 JSON 并拒绝非有限数值和语法错误', () => {
    expect(parseJsonValue('{"value":1}')).toEqual({ value: 1 });
    expect(() => parseJsonValue('{"value":1e400}')).toThrow('JSON 包含不支持的值');
    expect(tryParseJsonValue('null')).toBeNull();
    expect(tryParseJsonValue('{"value":1}')).toEqual({ value: 1 });
    expect(tryParseJsonValue('{"value":1e400}')).toBeUndefined();
    expect(tryParseJsonValue('{invalid}')).toBeUndefined();
  });
});
