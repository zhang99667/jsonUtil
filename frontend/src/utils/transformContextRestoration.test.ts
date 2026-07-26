import { describe, expect, it } from 'vitest';
import { TransformMode, type JsonObject, type TransformContext } from '../types.ts';
import { base64Encode } from './schemeUtils.ts';
import { inverseWithContext } from './transformations.ts';

const createContext = (
  records: TransformContext['records'] = new Map()
): TransformContext => ({
  mode: TransformMode.DEEP_FORMAT,
  records,
  timestamp: 0,
  originalIndentation: 0,
  sourceFormat: 'json',
});

describe('inverseWithContext 容器还原', () => {
  it('七千层对象的末端转换不会被异常兜底静默跳过', () => {
    const depth = 7_000;
    const path = `$${'.child'.repeat(depth)}`;
    const input = `${'{"child":'.repeat(depth)}"你好"${'}'.repeat(depth)}`;
    const context = createContext(new Map([[path, {
      path,
      originalValue: base64Encode('你好'),
      steps: [{ type: 'base64_decode' }],
    }]]));
    let cursor = JSON.parse(inverseWithContext(input, context)) as JsonObject;
    for (let index = 0; index < depth; index += 1) {
      cursor = cursor.child as JsonObject;
    }

    expect(cursor).toBe(base64Encode('你好'));
  });

  it('特殊键保留为普通自有属性', () => {
    const restored = JSON.parse(inverseWithContext(
      '{"__proto__":{"polluted":true},"ok":1}',
      createContext()
    )) as JsonObject;

    expect(Object.hasOwn(restored, '__proto__')).toBe(true);
    expect(Object.getPrototypeOf(restored)).toBe(Object.prototype);
    expect(restored['__proto__']).toEqual({ polluted: true });
  });
});
