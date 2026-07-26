import { describe, expect, it } from 'vitest';
import { parseSchemeMetadataSourceShape } from './schemeMetadataSourceShape';

describe('schemeMetadataSourceShape 深层归一化', () => {
  it('稳定解析七千层对象数组混合来源并保留特殊键', () => {
    let source = '{"__proto__":{"value":"sampleapp://v1/open"}}';
    for (let depth = 0; depth < 7_000; depth += 1) {
      source = depth % 2 === 0 ? `{"child":${source}}` : `[${source}]`;
    }

    let current: unknown = parseSchemeMetadataSourceShape(source);
    for (let depth = 6_999; depth >= 0; depth -= 1) {
      if (depth % 2 === 0) {
        expect(current).toBeTypeOf('object');
        current = (current as Record<string, unknown>).child;
      } else {
        expect(Array.isArray(current)).toBe(true);
        current = (current as unknown[])[0];
      }
    }

    expect(Object.hasOwn(current as object, '__proto__')).toBe(true);
    expect((current as Record<string, unknown>).__proto__).toEqual({
      value: 'sampleapp://v1/open',
    });
  });
});
