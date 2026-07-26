import { describe, expect, it } from 'vitest';
import type { StructuredValue } from './schemeTypes';
import { createSchemeNestedDecoder } from './schemeNestedDecoding';

const createTestDecoder = (visitedStrings: string[] = []) => createSchemeNestedDecoder({
  base64Decode: value => value,
  createRawParamOptions: () => ({
    decodeKey: value => value,
    decodeValue: value => value,
    isKnownParamName: () => false,
    isUrlValue: () => false,
    isJsonValue: () => false,
  }),
  decodeQueryComponent: value => value,
  decodeQueryValueComponent: value => value,
  decodeScheme: value => ({
    original: value,
    decoded: value,
    layers: [],
    isJson: false,
  }),
  detectSchemeType: value => {
    visitedStrings.push(value);
    return 'plain';
  },
  getFragmentParamSource: () => null,
  getPrefixedQueryString: () => null,
  isDecodableQueryString: () => false,
  looksLikeStructuredPayload: () => false,
  parseLogFieldParamString: () => null,
  tryParseJsonStringPayload: () => null,
});

describe('createSchemeNestedDecoder', () => {
  it('万级结构化对象遍历不依赖调用栈', () => {
    const depth = 10_000;
    let value: StructuredValue = '末端';
    for (let index = 0; index < depth; index += 1) {
      value = { child: value };
    }

    let cursor = createTestDecoder().decodeStructuredValue(value, 15) as Record<string, StructuredValue>;
    for (let index = 1; index < depth; index += 1) {
      cursor = cursor.child as Record<string, StructuredValue>;
    }

    expect(cursor.child).toBe('末端');
  });

  it('保持深度优先顺序、稀疏数组和特殊键', () => {
    const visitedStrings: string[] = [];
    const sparse = new Array<StructuredValue>(2);
    sparse[1] = '数组值';
    const value = JSON.parse(
      '{"first":["一",{"child":"二"}],"__proto__":{"safe":"三"}}'
    ) as Record<string, StructuredValue>;
    value.sparse = sparse;

    const result = createTestDecoder(visitedStrings).decodeStructuredValue(value, 15) as Record<string, StructuredValue>;
    const sparseResult = result.sparse as StructuredValue[];

    expect(visitedStrings).toEqual(['一', '二', '三', '数组值']);
    expect(Object.hasOwn(result, '__proto__')).toBe(true);
    expect(Object.getPrototypeOf(result)).toBe(Object.prototype);
    expect(0 in sparseResult).toBe(false);
  });
});
