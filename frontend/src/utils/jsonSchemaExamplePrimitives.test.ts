import { describe, expect, it } from 'vitest';
import {
  cloneJsonValue,
  generateStringExample,
  getEnumValueAt,
  getPatternMatcher,
  getUniqueStringExample,
  serializeExampleValue,
} from './jsonSchemaExamplePrimitives';

describe('JSON Schema 原始值示例约束', () => {
  it('深拷贝合法 JSON 值并拒绝非 JSON 值', () => {
    const source = { nested: ['value'] };
    const cloned = cloneJsonValue(source);

    expect(cloned).toEqual(source);
    expect(cloned).not.toBe(source);
    expect(cloneJsonValue(new Date())).toBeUndefined();
    expect(cloneJsonValue(Number.NaN)).toBeUndefined();
  });

  it('格式、长度和正则约束生成稳定字符串', () => {
    expect(generateStringExample({ format: 'email' })).toBe('user@example.com');
    expect(generateStringExample({ minLength: 8 })).toHaveLength(8);
    expect(generateStringExample({ pattern: '^ID-[0-9]+$' })).toBe('ID-1');
    expect(generateStringExample({ maxLength: 2 })).toBe('x');
  });

  it('非法正则安全失败，唯一字符串继续遵守约束', () => {
    expect(getPatternMatcher('[')('value')).toBe(false);
    expect(getUniqueStringExample('A', { pattern: '^[A-Z]$', maxLength: 1 }, 1)).toBe('B');
    expect(getUniqueStringExample('A', { pattern: '^A$', maxLength: 1 }, 1)).toBeUndefined();
  });

  it('枚举读取返回独立副本并复用 JSON 序列化', () => {
    const schema = { enum: [{ id: 1 }] };
    const value = getEnumValueAt(schema, 0);

    expect(value).toEqual({ id: 1 });
    expect(value).not.toBe(schema.enum[0]);
    expect(getEnumValueAt(schema, 1)).toBeUndefined();
    expect(serializeExampleValue(value)).toBe('{"id":1}');
  });
});
