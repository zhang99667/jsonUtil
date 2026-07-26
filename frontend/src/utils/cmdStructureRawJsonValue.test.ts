import { describe, expect, it } from 'vitest';
import type { JsonObject } from '../types';
import {
  toCmdStructureJsonValue,
  tryParseRawCmdJsonString,
} from './cmdStructureRawJsonValue';

describe('cmdStructureRawJsonValue', () => {
  it('解析普通 JSON 和 URL 编码 JSON 字符串', () => {
    expect(tryParseRawCmdJsonString('{"nid":123}')).toEqual({ nid: 123 });
    expect(tryParseRawCmdJsonString('%7B%22nid%22%3A123%7D')).toEqual({ nid: 123 });
    expect(tryParseRawCmdJsonString('{"value":1e400}')).toBeUndefined();
  });

  it('非 JSON 形态文本不会进入 JSON 解析', () => {
    expect(tryParseRawCmdJsonString('cmd=%7B%7D')).toBeUndefined();
    expect(tryParseRawCmdJsonString('plain')).toBeUndefined();
  });

  it('将 unknown 递归转换成 JsonValue', () => {
    expect(toCmdStructureJsonValue({
      title: '按钮',
      count: 2,
      enabled: true,
      nested: [{ value: undefined }],
    })).toEqual({
      title: '按钮',
      count: 2,
      enabled: true,
      nested: [{ value: 'undefined' }],
    });

    const sparse = new Array<unknown>(2);
    sparse[1] = undefined;
    const sparseResult = toCmdStructureJsonValue(sparse) as unknown[];
    expect(0 in sparseResult).toBe(false);
    expect(sparseResult[1]).toBe('undefined');
  });

  it('七千层 unknown 对象仍能转换末端值', () => {
    const depth = 7_000;
    let value: unknown = undefined;
    for (let index = 0; index < depth; index += 1) {
      value = { child: value };
    }

    let cursor = toCmdStructureJsonValue(value) as JsonObject;
    for (let index = 1; index < depth; index += 1) {
      cursor = cursor.child as JsonObject;
    }

    expect(cursor.child).toBe('undefined');
  });

  it('转换时保留特殊对象键', () => {
    const value = JSON.parse('{"__proto__":{"polluted":true},"safe":1}') as unknown;
    const result = toCmdStructureJsonValue(value) as JsonObject;

    expect(Object.hasOwn(result, '__proto__')).toBe(true);
    expect(Object.getPrototypeOf(result)).toBe(Object.prototype);
    expect(result['__proto__']).toEqual({ polluted: true });
  });
});
