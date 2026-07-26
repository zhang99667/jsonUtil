import { describe, expect, it } from 'vitest';
import { generateJsonSchemaExampleText } from './jsonSchemaExample';

describe('JSON Schema 唯一数组示例', () => {
  it('对象属性顺序不影响重复判定', () => {
    const schemaText = JSON.stringify({
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      type: 'array',
      minItems: 2,
      uniqueItems: true,
      prefixItems: [
        {
          type: 'object',
          required: ['name', 'id'],
          additionalProperties: false,
          properties: {
            id: { const: 1 },
            name: { const: 'same' },
          },
        },
        {
          type: 'object',
          required: ['id', 'name'],
          additionalProperties: false,
          properties: {
            name: { enum: ['same', 'next'] },
            id: { const: 1 },
          },
        },
      ],
      items: false,
    });
    const result = generateJsonSchemaExampleText(schemaText);

    expect(result.error).toBeUndefined();
    expect(JSON.parse(result.exampleText || '[]')).toEqual([
      { id: 1, name: 'same' },
      { name: 'next', id: 1 },
    ]);
  });
});
