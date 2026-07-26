import { describe, expect, it } from 'vitest';
import type { JsonObject, JsonValue } from '../types.ts';
import { defineJsonProperty } from './jsonObjectProperty.ts';
import { stringifyJsonValue } from './jsonValueStringify.ts';

describe('stringifyJsonValue', () => {
  it('与 JSON.stringify 的紧凑和缩进结果一致', () => {
    const value: JsonValue = {
      text: '你好\nworld',
      values: [1, true, null, { nested: 'ok' }],
    };

    expect(stringifyJsonValue(value)).toBe(JSON.stringify(value));
    expect(stringifyJsonValue(value, 2)).toBe(JSON.stringify(value, null, 2));
    expect(stringifyJsonValue(value, '\t')).toBe(JSON.stringify(value, null, '\t'));
  });

  it('七千层对象序列化不依赖 JavaScript 调用栈', () => {
    const depth = 7_000;
    const root: JsonObject = {};
    let cursor = root;
    for (let index = 0; index < depth; index += 1) {
      const child: JsonObject = {};
      cursor.child = child;
      cursor = child;
    }
    cursor.value = 'done';

    const output = stringifyJsonValue(root);
    expect(output.startsWith('{"child":')).toBe(true);
    expect(output.endsWith('"value":"done"' + '}'.repeat(depth + 1))).toBe(true);
  });

  it('保留特殊对象键并拒绝循环结构', () => {
    const value: JsonObject = {};
    defineJsonProperty(value, '__proto__', { safe: true });
    expect(stringifyJsonValue(value)).toBe('{"__proto__":{"safe":true}}');

    const cyclic: JsonObject = {};
    cyclic.self = cyclic;
    expect(() => stringifyJsonValue(cyclic)).toThrow('Converting circular structure to JSON');
  });
});
