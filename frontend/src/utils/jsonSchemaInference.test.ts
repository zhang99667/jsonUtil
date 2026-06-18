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
