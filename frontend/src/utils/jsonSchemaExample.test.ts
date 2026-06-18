import { describe, expect, it } from 'vitest';
import { generateJsonSchemaExampleText } from './jsonSchemaExample';
import { validateJsonAgainstSchema } from './jsonSchemaValidation';

describe('jsonSchemaExample', () => {
  it('根据对象 Schema 生成可通过校验的示例 JSON', () => {
    const schemaText = JSON.stringify({
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      type: 'object',
      required: ['id', 'email', 'items'],
      properties: {
        id: { type: 'integer', minimum: 100 },
        email: { type: 'string', format: 'email' },
        status: { enum: ['created', 'paid'] },
        items: {
          type: 'array',
          minItems: 2,
          items: {
            type: 'object',
            required: ['sku', 'price'],
            properties: {
              sku: { type: 'string', minLength: 4 },
              price: { type: 'number', minimum: 1 },
            },
          },
        },
      },
    });
    const result = generateJsonSchemaExampleText(schemaText);
    const example = JSON.parse(result.exampleText || '{}');

    expect(example).toMatchObject({
      id: 100,
      email: 'user@example.com',
      status: 'created',
      items: [
        { sku: 'string', price: 1 },
        { sku: 'string', price: 1 },
      ],
    });
    expect(validateJsonAgainstSchema(result.exampleText || '', schemaText).status).toBe('valid');
  });

  it('支持 default、examples、const 和本地 $ref', () => {
    const schemaText = JSON.stringify({
      $defs: {
        user: {
          type: 'object',
          required: ['name', 'role'],
          properties: {
            name: { examples: ['Alice'] },
            role: { const: 'admin' },
          },
        },
      },
      type: 'object',
      required: ['requestId', 'user'],
      properties: {
        requestId: { type: 'string', default: 'req-001' },
        user: { $ref: '#/$defs/user' },
      },
    });
    const result = generateJsonSchemaExampleText(schemaText);

    expect(JSON.parse(result.exampleText || '{}')).toEqual({
      requestId: 'req-001',
      user: {
        name: 'Alice',
        role: 'admin',
      },
    });
    expect(validateJsonAgainstSchema(result.exampleText || '', schemaText).status).toBe('valid');
  });

  it('支持动态对象 Schema 的 patternProperties 和 additionalProperties', () => {
    const schemaText = JSON.stringify({
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      type: 'object',
      minProperties: 2,
      propertyNames: {
        pattern: '^[a-z_]+$',
      },
      patternProperties: {
        '^meta_[a-z]+$': {
          type: 'integer',
          minimum: 5,
        },
      },
      additionalProperties: {
        type: 'boolean',
      },
    });
    const result = generateJsonSchemaExampleText(schemaText);
    const example = JSON.parse(result.exampleText || '{}');

    expect(example).toMatchObject({
      meta_key: 5,
      key: true,
    });
    expect(validateJsonAgainstSchema(result.exampleText || '', schemaText).status).toBe('valid');
  });

  it('为常见字符串 pattern 生成可校验的样例值', () => {
    const schemaText = JSON.stringify({
      type: 'object',
      required: ['orderId', 'traceCode'],
      properties: {
        orderId: {
          type: 'string',
          pattern: '^ORD-[0-9]+$',
        },
        traceCode: {
          type: 'string',
          pattern: '^[A-Z]{3}-\\d{4}$',
        },
      },
    });
    const result = generateJsonSchemaExampleText(schemaText);
    const example = JSON.parse(result.exampleText || '{}');

    expect(example).toEqual({
      orderId: 'ORD-1',
      traceCode: 'AAA-1111',
    });
    expect(validateJsonAgainstSchema(result.exampleText || '', schemaText).status).toBe('valid');
  });

  it('为 uniqueItems 数组生成不重复的样例值', () => {
    const schemaText = JSON.stringify({
      type: 'object',
      required: ['tags', 'items'],
      properties: {
        tags: {
          type: 'array',
          minItems: 3,
          uniqueItems: true,
          items: {
            type: 'string',
          },
        },
        items: {
          type: 'array',
          minItems: 2,
          uniqueItems: true,
          items: {
            type: 'object',
            required: ['id'],
            additionalProperties: false,
            properties: {
              id: {
                type: 'integer',
                minimum: 1,
              },
            },
          },
        },
      },
    });
    const result = generateJsonSchemaExampleText(schemaText);
    const example = JSON.parse(result.exampleText || '{}');

    expect(example).toEqual({
      tags: ['string', 'string2', 'string3'],
      items: [
        { id: 1 },
        { id: 2 },
      ],
    });
    expect(validateJsonAgainstSchema(result.exampleText || '', schemaText).status).toBe('valid');
  });

  it('处理非法或永假 Schema 时返回可读错误', () => {
    expect(generateJsonSchemaExampleText('{bad}').error).toContain('Schema 不是合法 JSON');
    expect(generateJsonSchemaExampleText('false')).toMatchObject({
      error: '当前 Schema 不允许任何 JSON 值，无法生成示例',
    });
  });
});
