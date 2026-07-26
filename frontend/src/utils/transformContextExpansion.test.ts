import { describe, expect, it } from 'vitest';
import type { JsonObject } from '../types.ts';
import { deepParseWithContext } from './transformations.ts';

describe('deepParseWithContext 容器展开', () => {
  it('深层对象末端的 Unicode 转义不依赖 JavaScript 调用栈', () => {
    const depth = 3_000;
    const input = `${'{"child":'.repeat(depth)}"\\\\u4f60\\\\u597d"${'}'.repeat(depth)}`;
    const result = deepParseWithContext(input);
    let cursor = JSON.parse(result.output) as JsonObject;
    for (let index = 0; index < depth; index += 1) {
      cursor = cursor.child as JsonObject;
    }

    expect(cursor).toBe('你好');
  });

  it('特殊键及其子节点转换保持普通自有属性', () => {
    const result = deepParseWithContext(
      '{"__proto__":{"value":"\\\\u4f60"},"ok":1}'
    );
    const parsed = JSON.parse(result.output) as JsonObject;

    expect(Object.hasOwn(parsed, '__proto__')).toBe(true);
    expect(Object.getPrototypeOf(parsed)).toBe(Object.prototype);
    expect(parsed['__proto__']).toEqual({ value: '你' });
  });
});
