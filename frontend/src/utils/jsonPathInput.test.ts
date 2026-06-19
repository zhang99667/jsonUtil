import { describe, expect, it } from 'vitest';
import {
  formatJsonPathRecursiveFieldQuery,
  getJsonPointerLastFieldName,
  normalizeJsonPathQueryInput,
} from './jsonPathInput';

describe('jsonPathInput', () => {
  it('将字段名快捷输入转成递归 JSONPath 查询', () => {
    expect(normalizeJsonPathQueryInput('traceId')).toEqual({
      query: '$..traceId',
      isFieldNameShortcut: true,
    });
    expect(normalizeJsonPathQueryInput(' action_cmd ')).toEqual({
      query: '$..action_cmd',
      isFieldNameShortcut: true,
    });
  });

  it('为特殊字段名生成 bracket JSONPath 查询', () => {
    expect(normalizeJsonPathQueryInput('button-cmd')).toEqual({
      query: '$..["button-cmd"]',
      isFieldNameShortcut: true,
    });
    expect(normalizeJsonPathQueryInput('trace.id')).toEqual({
      query: '$..["trace.id"]',
      isFieldNameShortcut: true,
    });
    expect(normalizeJsonPathQueryInput('电话')).toEqual({
      query: '$..["电话"]',
      isFieldNameShortcut: true,
    });
  });

  it('保留标准 JSONPath 和明显不是字段名的输入', () => {
    expect(normalizeJsonPathQueryInput('$.users[*].name')).toEqual({
      query: '$.users[*].name',
      isFieldNameShortcut: false,
    });
    expect(normalizeJsonPathQueryInput('@.age')).toEqual({
      query: '@.age',
      isFieldNameShortcut: false,
    });
    expect(normalizeJsonPathQueryInput('[0]')).toEqual({
      query: '[0]',
      isFieldNameShortcut: false,
    });
    expect(normalizeJsonPathQueryInput('https://example.com')).toEqual({
      query: 'https://example.com',
      isFieldNameShortcut: false,
    });
    expect(normalizeJsonPathQueryInput('name age')).toEqual({
      query: 'name age',
      isFieldNameShortcut: false,
    });
  });

  it('可为结构导航里的任意真实字段名生成递归查询', () => {
    expect(formatJsonPathRecursiveFieldQuery('name')).toBe('$..name');
    expect(formatJsonPathRecursiveFieldQuery('trace.id')).toBe('$..["trace.id"]');
    expect(formatJsonPathRecursiveFieldQuery('a/b~c')).toBe('$..["a/b~c"]');
    expect(formatJsonPathRecursiveFieldQuery('https://key')).toBe('$..["https://key"]');
    expect(formatJsonPathRecursiveFieldQuery('中文 key')).toBe('$..["中文 key"]');
    expect(formatJsonPathRecursiveFieldQuery('quote"key')).toBe('$..[?(@property == "quote\\"key")]');
    expect(formatJsonPathRecursiveFieldQuery("single'key")).toBe('$..[?(@property == "single\'key")]');
  });

  it('可从 JSON Pointer 提取最后一个真实字段名', () => {
    expect(getJsonPointerLastFieldName('/items/0/price')).toBe('price');
    expect(getJsonPointerLastFieldName('/items/0')).toBe('items');
    expect(getJsonPointerLastFieldName('/0/user/trace.id')).toBe('trace.id');
    expect(getJsonPointerLastFieldName('/meta/a~1b~0c')).toBe('a/b~c');
    expect(getJsonPointerLastFieldName('/0/1')).toBeNull();
    expect(getJsonPointerLastFieldName('')).toBeNull();
  });

  it('结合 JSON 数据区分数组下标和数字字符串字段', () => {
    const data = {
      metrics: {
        '2024': 10,
      },
      items: [
        { price: 1 },
      ],
    };

    expect(getJsonPointerLastFieldName('/metrics/2024', data)).toBe('2024');
    expect(getJsonPointerLastFieldName('/items/0', data)).toBe('items');
    expect(getJsonPointerLastFieldName('/items/0/price', data)).toBe('price');
    expect(formatJsonPathRecursiveFieldQuery(getJsonPointerLastFieldName('/metrics/2024', data) || ''))
      .toBe('$..["2024"]');
  });
});
