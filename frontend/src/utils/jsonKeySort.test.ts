import { describe, expect, it } from 'vitest';
import { TransformMode, type JsonObject } from '../types.ts';
import { sortJsonKeys } from './jsonKeySort.ts';
import { performTransform } from './transformations.ts';

const createDeepObject = (depth: number): JsonObject => {
  let value: JsonObject = { z: 1, a: 2 };
  for (let index = 0; index < depth; index += 1) {
    value = { child: value };
  }
  return value;
};

describe('sortJsonKeys', () => {
  it('按字母序排列嵌套对象键并保持数组顺序', () => {
    expect(sortJsonKeys({ b: 2, a: { d: 4, c: 3 }, list: [{ z: 1, y: 2 }] })).toEqual({
      a: { c: 3, d: 4 },
      b: 2,
      list: [{ y: 2, z: 1 }],
    });
  });

  it('万级嵌套对象排序不依赖 JavaScript 调用栈', () => {
    const depth = 10_000;
    const result = sortJsonKeys(createDeepObject(depth));
    let cursor = result as JsonObject;
    for (let index = 0; index < depth; index += 1) {
      cursor = cursor.child as JsonObject;
    }

    expect(Object.keys(cursor)).toEqual(['a', 'z']);
  });

  it('特殊键保留为普通自有属性', () => {
    const input = JSON.parse('{"z":1,"__proto__":{"polluted":true},"a":2}') as JsonObject;
    const result = sortJsonKeys(input) as JsonObject;

    expect(Object.keys(result)).toEqual(['__proto__', 'a', 'z']);
    expect(Object.hasOwn(result, '__proto__')).toBe(true);
    expect(Object.getPrototypeOf(result)).toBe(Object.prototype);
    expect(result['__proto__']).toEqual({ polluted: true });
  });
});

describe('SORT_KEYS 模式', () => {
  it('格式化输出按字母序排列对象键', () => {
    const input = '{"b":2,"a":{"d":4,"c":3},"list":[{"z":1,"y":2}]}';
    const result = performTransform(input, TransformMode.SORT_KEYS);

    expect(JSON.parse(result)).toEqual({
      a: { c: 3, d: 4 },
      b: 2,
      list: [{ y: 2, z: 1 }],
    });
    expect(result.indexOf('"a"')).toBeLessThan(result.indexOf('"b"'));
  });

  it('排序赋值包装中的 JSON', () => {
    expect(performTransform(
      'var payload = {"b":2,"a":1};',
      TransformMode.SORT_KEYS
    )).toBe(JSON.stringify({ a: 1, b: 2 }, null, 2));
  });

  it('逐行排序 JSON Lines 对象键', () => {
    const input = '{"b":2,"a":1}\n{"d":4,"c":3}';
    expect(performTransform(input, TransformMode.SORT_KEYS)).toBe('{"a":1,"b":2}\n{"c":3,"d":4}');
  });

  it('深层 JSON Lines 排序不会静默退回原文', () => {
    const depth = 7_000;
    const record = `${'{"child":'.repeat(depth)}{"z":1,"a":2}${'}'.repeat(depth)}`;
    const [sorted] = performTransform(`${record}\n0`, TransformMode.SORT_KEYS).split('\n');
    let cursor = JSON.parse(sorted) as JsonObject;
    for (let index = 0; index < depth; index += 1) {
      cursor = cursor.child as JsonObject;
    }

    expect(Object.keys(cursor)).toEqual(['a', 'z']);
  });
});
