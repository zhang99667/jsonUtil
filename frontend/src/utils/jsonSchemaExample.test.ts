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

  it('支持 dependentRequired 和 dependencies 的对象依赖字段', () => {
    const dependentRequiredSchemaText = JSON.stringify({
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      type: 'object',
      required: ['type'],
      additionalProperties: false,
      properties: {
        type: { const: 'book' },
        id: {
          type: 'string',
          pattern: '^ID-[0-9]+$',
        },
      },
      dependentRequired: {
        type: ['id'],
      },
    });
    const dependenciesSchemaText = JSON.stringify({
      type: 'object',
      required: ['creditCard'],
      additionalProperties: false,
      properties: {
        creditCard: {
          type: 'string',
          minLength: 4,
        },
        billingAddress: {
          type: 'string',
          minLength: 6,
        },
      },
      dependencies: {
        creditCard: ['billingAddress'],
      },
    });
    const dependentRequiredResult = generateJsonSchemaExampleText(dependentRequiredSchemaText);
    const dependenciesResult = generateJsonSchemaExampleText(dependenciesSchemaText);

    expect(JSON.parse(dependentRequiredResult.exampleText || '{}')).toEqual({
      type: 'book',
      id: 'ID-1',
    });
    expect(JSON.parse(dependenciesResult.exampleText || '{}')).toEqual({
      creditCard: 'string',
      billingAddress: 'string',
    });
    expect(validateJsonAgainstSchema(dependentRequiredResult.exampleText || '', dependentRequiredSchemaText).status).toBe('valid');
    expect(validateJsonAgainstSchema(dependenciesResult.exampleText || '', dependenciesSchemaText).status).toBe('valid');
  });

  it('支持 dependentSchemas 和 schema dependencies 的对象依赖子 Schema', () => {
    const dependentSchemasText = JSON.stringify({
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      type: 'object',
      required: ['paymentType'],
      additionalProperties: false,
      properties: {
        paymentType: { const: 'card' },
        billingAddress: {
          type: 'string',
          minLength: 8,
        },
        invoice: {
          type: 'boolean',
        },
      },
      dependentSchemas: {
        paymentType: {
          required: ['billingAddress'],
          properties: {
            billingAddress: {
              type: 'string',
              minLength: 8,
            },
            invoice: {
              const: true,
            },
          },
        },
      },
    });
    const schemaDependenciesText = JSON.stringify({
      type: 'object',
      required: ['mode'],
      additionalProperties: false,
      properties: {
        mode: { const: 'pro' },
        quota: {
          type: 'integer',
          minimum: 10,
        },
        note: {
          type: 'string',
          pattern: '^PRO-[0-9]+$',
        },
      },
      dependencies: {
        mode: {
          required: ['quota', 'note'],
          properties: {
            quota: {
              type: 'integer',
              minimum: 10,
            },
            note: {
              type: 'string',
              pattern: '^PRO-[0-9]+$',
            },
          },
        },
      },
    });
    const dependentSchemasResult = generateJsonSchemaExampleText(dependentSchemasText);
    const schemaDependenciesResult = generateJsonSchemaExampleText(schemaDependenciesText);

    expect(JSON.parse(dependentSchemasResult.exampleText || '{}')).toEqual({
      paymentType: 'card',
      billingAddress: 'stringxx',
      invoice: true,
    });
    expect(JSON.parse(schemaDependenciesResult.exampleText || '{}')).toEqual({
      mode: 'pro',
      quota: 10,
      note: 'PRO-1',
    });
    expect(validateJsonAgainstSchema(dependentSchemasResult.exampleText || '', dependentSchemasText).status).toBe('valid');
    expect(validateJsonAgainstSchema(schemaDependenciesResult.exampleText || '', schemaDependenciesText).status).toBe('valid');
  });

  it('支持 if then else 条件分支补齐对象字段', () => {
    const thenSchemaText = JSON.stringify({
      type: 'object',
      required: ['kind'],
      properties: {
        kind: { const: 'card' },
      },
      if: {
        required: ['kind'],
        properties: {
          kind: { const: 'card' },
        },
      },
      then: {
        required: ['cardNumber'],
        properties: {
          cardNumber: {
            type: 'string',
            pattern: '^CARD-[0-9]+$',
          },
        },
      },
    });
    const elseSchemaText = JSON.stringify({
      type: 'object',
      required: ['kind'],
      properties: {
        kind: { const: 'bank' },
      },
      if: {
        required: ['kind'],
        properties: {
          kind: { const: 'card' },
        },
      },
      then: {
        required: ['cardNumber'],
        properties: {
          cardNumber: {
            type: 'string',
            pattern: '^CARD-[0-9]+$',
          },
        },
      },
      else: {
        required: ['bankAccount'],
        properties: {
          bankAccount: {
            type: 'string',
            pattern: '^BANK-[0-9]+$',
          },
        },
      },
    });
    const thenResult = generateJsonSchemaExampleText(thenSchemaText);
    const elseResult = generateJsonSchemaExampleText(elseSchemaText);

    expect(JSON.parse(thenResult.exampleText || '{}')).toEqual({
      kind: 'card',
      cardNumber: 'CARD-1',
    });
    expect(JSON.parse(elseResult.exampleText || '{}')).toEqual({
      kind: 'bank',
      bankAccount: 'BANK-1',
    });
    expect(validateJsonAgainstSchema(thenResult.exampleText || '', thenSchemaText).status).toBe('valid');
    expect(validateJsonAgainstSchema(elseResult.exampleText || '', elseSchemaText).status).toBe('valid');
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

  it('为受限短字符串 uniqueItems 生成不重复的样例值', () => {
    const schemaText = JSON.stringify({
      type: 'object',
      required: ['codes', 'tokens'],
      properties: {
        codes: {
          type: 'array',
          minItems: 3,
          uniqueItems: true,
          items: {
            type: 'string',
            maxLength: 1,
            pattern: '^[A-Z]$',
          },
        },
        tokens: {
          type: 'array',
          minItems: 3,
          uniqueItems: true,
          items: {
            type: 'string',
            pattern: '^[A-Z]{3}$',
          },
        },
      },
    });
    const result = generateJsonSchemaExampleText(schemaText);
    const example = JSON.parse(result.exampleText || '{}');

    expect(example).toEqual({
      codes: ['A', 'B', 'C'],
      tokens: ['AAA', 'AAB', 'AAC'],
    });
    expect(validateJsonAgainstSchema(result.exampleText || '', schemaText).status).toBe('valid');
  });

  it('为 contains 数组生成满足条件的样例元素', () => {
    const schemaText = JSON.stringify({
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      type: 'object',
      required: ['events'],
      properties: {
        events: {
          type: 'array',
          minItems: 3,
          minContains: 2,
          contains: {
            type: 'object',
            required: ['code'],
            properties: {
              code: {
                type: 'string',
                pattern: '^ERR-[0-9]+$',
              },
            },
          },
          items: {
            type: 'object',
            additionalProperties: true,
          },
        },
      },
    });
    const result = generateJsonSchemaExampleText(schemaText);
    const example = JSON.parse(result.exampleText || '{}');

    expect(example.events).toEqual([
      { code: 'ERR-1' },
      { code: 'ERR-1' },
      {},
    ]);
    expect(validateJsonAgainstSchema(result.exampleText || '', schemaText).status).toBe('valid');
  });

  it('为 contains 与 uniqueItems 组合数组生成不重复的匹配元素', () => {
    const schemaText = JSON.stringify({
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      type: 'object',
      required: ['events'],
      properties: {
        events: {
          type: 'array',
          minItems: 3,
          minContains: 2,
          uniqueItems: true,
          contains: {
            type: 'object',
            required: ['code'],
            additionalProperties: false,
            properties: {
              code: {
                type: 'string',
                pattern: '^ERR-[0-9]+$',
              },
            },
          },
          items: {
            type: 'object',
            additionalProperties: true,
          },
        },
      },
    });
    const result = generateJsonSchemaExampleText(schemaText);
    const example = JSON.parse(result.exampleText || '{}');

    expect(example.events).toEqual([
      { code: 'ERR-1' },
      { code: 'ERR-2' },
      {},
    ]);
    expect(validateJsonAgainstSchema(result.exampleText || '', schemaText).status).toBe('valid');
  });

  it('按常见数组下限扩展示例项数并通过自校验', () => {
    const schemaText = JSON.stringify({
      type: 'array',
      minItems: 5,
      items: {
        type: 'string',
      },
    });
    const result = generateJsonSchemaExampleText(schemaText);
    const example = JSON.parse(result.exampleText || '[]');

    expect(example).toEqual(['string', 'string', 'string', 'string', 'string']);
    expect(validateJsonAgainstSchema(result.exampleText || '', schemaText).status).toBe('valid');
  });

  it('按常见 contains 下限扩展唯一匹配元素并通过自校验', () => {
    const schemaText = JSON.stringify({
      type: 'array',
      minContains: 5,
      uniqueItems: true,
      contains: {
        type: 'object',
        required: ['code'],
        additionalProperties: false,
        properties: {
          code: {
            type: 'string',
            pattern: '^ERR-[0-9]+$',
          },
        },
      },
      items: {
        type: 'object',
        additionalProperties: true,
      },
    });
    const result = generateJsonSchemaExampleText(schemaText);
    const example = JSON.parse(result.exampleText || '[]');

    expect(example).toEqual([
      { code: 'ERR-1' },
      { code: 'ERR-2' },
      { code: 'ERR-3' },
      { code: 'ERR-4' },
      { code: 'ERR-5' },
    ]);
    expect(validateJsonAgainstSchema(result.exampleText || '', schemaText).status).toBe('valid');
  });

  it('为 oneOf 和 anyOf 选择可通过整体校验的分支示例', () => {
    const oneOfSchemaText = JSON.stringify({
      oneOf: [
        {
          type: 'string',
          minLength: 1,
        },
        {
          type: 'string',
          pattern: '^string$',
        },
        {
          type: 'object',
          required: ['kind'],
          additionalProperties: false,
          properties: {
            kind: {
              const: 'fallback',
            },
          },
        },
      ],
    });
    const anyOfSchemaText = JSON.stringify({
      anyOf: [
        {
          type: 'array',
          minItems: 9,
          items: {
            type: 'string',
          },
        },
        {
          const: 'fallback',
        },
      ],
    });
    const oneOfResult = generateJsonSchemaExampleText(oneOfSchemaText);
    const anyOfResult = generateJsonSchemaExampleText(anyOfSchemaText);

    expect(JSON.parse(oneOfResult.exampleText || '{}')).toEqual({ kind: 'fallback' });
    expect(JSON.parse(anyOfResult.exampleText || '""')).toBe('fallback');
    expect(validateJsonAgainstSchema(oneOfResult.exampleText || '', oneOfSchemaText).status).toBe('valid');
    expect(validateJsonAgainstSchema(anyOfResult.exampleText || '', anyOfSchemaText).status).toBe('valid');
  });

  it('生成后自校验并拦截超出安全上限的数组下限示例', () => {
    const schemaText = JSON.stringify({
      type: 'array',
      minItems: 9,
      items: {
        type: 'string',
      },
    });
    const result = generateJsonSchemaExampleText(schemaText);

    expect(result.exampleText).toBeUndefined();
    expect(result.error).toContain('生成的示例未通过当前 Schema 校验');
    expect(result.error).toContain('$ [minItems]');
  });

  it('生成后自校验并拦截无法满足组合约束的示例', () => {
    const schemaText = JSON.stringify({
      type: 'object',
      required: ['status'],
      properties: {
        status: {
          type: 'string',
        },
      },
      not: {
        properties: {
          status: {
            const: 'string',
          },
        },
      },
    });
    const result = generateJsonSchemaExampleText(schemaText);

    expect(result.exampleText).toBeUndefined();
    expect(result.error).toContain('生成的示例未通过当前 Schema 校验');
    expect(result.error).toContain('$ [not]');
  });

  it('处理非法或永假 Schema 时返回可读错误', () => {
    expect(generateJsonSchemaExampleText('{bad}').error).toContain('Schema 不是合法 JSON');
    expect(generateJsonSchemaExampleText('false')).toMatchObject({
      error: '当前 Schema 不允许任何 JSON 值，无法生成示例',
    });
  });
});
