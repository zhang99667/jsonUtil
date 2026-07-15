import { JSONPath } from 'jsonpath-plus';
import { describe, expect, it } from 'vitest';
import {
  appendJsonPathIndex,
  appendJsonPathKey,
  isJsonPathIdentifier,
} from './jsonPathSegments';

describe('jsonPathSegments', () => {
  it('标识符键使用点语法', () => {
    expect(isJsonPathIdentifier('user_name$')).toBe(true);
    expect(appendJsonPathKey('$', 'user_name$')).toBe('$.user_name$');
  });

  it.each([
    ['a.b', '$["a.b"]'],
    ['a"b', '$[?(@property === "a\\"b")]'],
    ["a'b", '$[?(@property === "a\'b")]'],
    ['a\\b', '$[?(@property === "a\\\\b")]'],
    ['line\nbreak', '$[?(@property === "line\\nbreak")]'],
    ['a]b', '$[?(@property === "a]b")]'],
    ['中文', '$["中文"]'],
    ['', '$[""]'],
  ])('特殊键 %j 使用可执行的括号语法', (key, expectedPath) => {
    const root = { [key]: '命中' };
    const path = appendJsonPathKey('$', key);

    expect(isJsonPathIdentifier(key)).toBe(false);
    expect(path).toBe(expectedPath);
    expect(JSONPath({ path, json: root })).toEqual(['命中']);
  });

  it('数组下标使用括号语法', () => {
    expect(appendJsonPathIndex('$.items', 2)).toBe('$.items[2]');
  });
});
