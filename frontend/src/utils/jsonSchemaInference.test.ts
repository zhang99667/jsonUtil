import { describe, expect, it } from 'vitest';
import { inferJsonSchemaFromText } from './jsonSchemaInference';

describe('jsonSchemaInference', () => {
  it('根据对象生成基础 JSON Schema', () => {
    const result = inferJsonSchemaFromText(JSON.stringify({
      id: 1,
      name: '订单',
      paid: true,
      meta: null,
    }));
    const schema = JSON.parse(result.schemaText || '{}');

    expect(schema).toMatchObject({
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      title: '从 SOURCE 生成',
      type: 'object',
      required: ['id', 'name', 'paid', 'meta'],
      additionalProperties: true,
      properties: {
        id: { type: 'integer' },
        name: { type: 'string' },
        paid: { type: 'boolean' },
        meta: { type: 'null' },
      },
    });
  });

  it('数组对象 required 取样本交集', () => {
    const result = inferJsonSchemaFromText(JSON.stringify({
      items: [
        { id: 1, title: 'A', price: 1 },
        { id: 2, title: 'B' },
      ],
    }));
    const schema = JSON.parse(result.schemaText || '{}');

    expect(schema.properties.items.items).toMatchObject({
      type: 'object',
      required: ['id', 'title'],
      properties: {
        id: { type: 'integer' },
        title: { type: 'string' },
        price: { type: 'integer' },
      },
    });
  });

  it('宽松模式不生成 required 约束', () => {
    const result = inferJsonSchemaFromText(JSON.stringify({
      id: 1,
      profile: {
        name: '用户',
      },
      items: [
        { sku: 'A', price: 1 },
        { sku: 'B' },
      ],
    }), { requiredMode: 'loose' });
    const schema = JSON.parse(result.schemaText || '{}');

    expect(schema).not.toHaveProperty('required');
    expect(schema.properties.profile).not.toHaveProperty('required');
    expect(schema.properties.items.items).not.toHaveProperty('required');
    expect(schema.properties.items.items.properties).toMatchObject({
      sku: { type: 'string' },
      price: { type: 'integer' },
    });
  });

  it('为常见字符串值推断标准 format', () => {
    const result = inferJsonSchemaFromText(JSON.stringify({
      email: 'user@example.com',
      homepage: 'https://example.com/path?a=1',
      createdAt: '2026-06-18T10:11:12Z',
      traceId: '550e8400-e29b-41d4-a716-446655440000',
      title: '订单',
    }));
    const schema = JSON.parse(result.schemaText || '{}');

    expect(schema.properties).toMatchObject({
      email: { type: 'string', format: 'email' },
      homepage: { type: 'string', format: 'uri' },
      createdAt: { type: 'string', format: 'date-time' },
      traceId: { type: 'string', format: 'uuid' },
      title: { type: 'string' },
    });
    expect(schema.properties.title).not.toHaveProperty('format');
  });

  it('数组字符串仅在所有样本 format 一致时保留 format', () => {
    const emailResult = inferJsonSchemaFromText(JSON.stringify({
      contacts: ['a@example.com', 'b@example.com'],
    }));
    const mixedResult = inferJsonSchemaFromText(JSON.stringify({
      links: ['https://example.com', 'not-url'],
    }));
    const emailSchema = JSON.parse(emailResult.schemaText || '{}');
    const mixedSchema = JSON.parse(mixedResult.schemaText || '{}');

    expect(emailSchema.properties.contacts.items).toMatchObject({
      type: 'string',
      format: 'email',
    });
    expect(mixedSchema.properties.links.items).toEqual({ type: 'string' });
  });

  it('数组内整数和小数合并为 number', () => {
    const result = inferJsonSchemaFromText(JSON.stringify([1, 2.5]));
    const schema = JSON.parse(result.schemaText || '{}');

    expect(schema).toMatchObject({
      type: 'array',
      items: { type: 'number' },
    });
  });

  it('混合类型数组使用 type 数组表达', () => {
    const result = inferJsonSchemaFromText(JSON.stringify(['id', null, true]));
    const schema = JSON.parse(result.schemaText || '{}');

    expect(schema.items.type).toEqual(['boolean', 'null', 'string']);
  });

  it('空输入和非法 JSON 返回错误', () => {
    expect(inferJsonSchemaFromText('')).toMatchObject({
      error: '请先在 SOURCE 输入 JSON',
    });
    expect(inferJsonSchemaFromText('{bad}').error).toContain('SOURCE 不是合法 JSON');
  });
});
