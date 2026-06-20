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
    expect(result.trustSummary).toEqual({
      sourceSampleCount: 1,
      sourceSampleUsedCount: 1,
      objectSchemaCount: 1,
      propertyCount: 4,
      requiredFieldCount: 4,
      optionalFieldCount: 0,
      unionTypeCount: 0,
      formatFieldCount: 0,
      arrayTotalItemCount: 0,
      arraySampledItemCount: 0,
      sampledArrayCount: 0,
      requiredMode: 'strict',
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

  it('长数组后段稀疏字段也进入 Schema 且不误标 required', () => {
    const items = Array.from({ length: 45 }, (_, index) => ({
      id: index + 1,
      title: `item-${index + 1}`,
      ...(index === 35 ? { cmdSchema: 'makePhoneCall', traceId: 'late-trace' } : {}),
    }));
    const result = inferJsonSchemaFromText(JSON.stringify({ items }));
    const schema = JSON.parse(result.schemaText || '{}');

    expect(schema.properties.items.items.properties).toMatchObject({
      id: { type: 'integer' },
      title: { type: 'string' },
      cmdSchema: { type: 'string' },
      traceId: { type: 'string' },
    });
    expect(schema.properties.items.items.required).toEqual(['id', 'title']);
    expect(result.samplingSummaries).toEqual([{
      path: '$.items',
      totalItems: 45,
      sampledItems: 25,
      scannedItems: 45,
      sparseFieldKeys: ['cmdSchema', 'traceId'],
      isScanLimited: false,
      requiredMode: 'strict',
    }]);
    expect(result.trustSummary).toMatchObject({
      objectSchemaCount: 2,
      propertyCount: 5,
      requiredFieldCount: 3,
      optionalFieldCount: 2,
      arrayTotalItemCount: 45,
      arraySampledItemCount: 25,
      sampledArrayCount: 1,
      requiredMode: 'strict',
    });
  });

  it('长数组采样摘要标记稀疏字段扫描上限', () => {
    const items = Array.from({ length: 260 }, (_, index) => ({
      id: index + 1,
      ...(index === 230 ? { lateOnly: true } : {}),
    }));
    const result = inferJsonSchemaFromText(JSON.stringify({ items }), { requiredMode: 'loose' });

    expect(result.samplingSummaries).toEqual([{
      path: '$.items',
      totalItems: 260,
      sampledItems: 24,
      scannedItems: 200,
      sparseFieldKeys: [],
      isScanLimited: true,
      requiredMode: 'loose',
    }]);
  });

  it('长数组后段类型差异参与合并', () => {
    const rows = Array.from({ length: 45 }, (_, index) => ({
      score: index === 44 ? 'late-score' : index,
    }));
    const result = inferJsonSchemaFromText(JSON.stringify({ rows }));
    const schema = JSON.parse(result.schemaText || '{}');

    expect(schema.properties.rows.items.properties.score.type).toEqual(['integer', 'string']);
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
    expect(result.trustSummary).toMatchObject({
      requiredFieldCount: 0,
      optionalFieldCount: 6,
      requiredMode: 'loose',
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
    expect(result.trustSummary?.formatFieldCount).toBe(4);
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
    expect(result.samplingSummaries).toEqual([]);
  });

  it('混合类型数组使用 type 数组表达', () => {
    const result = inferJsonSchemaFromText(JSON.stringify(['id', null, true]));
    const schema = JSON.parse(result.schemaText || '{}');

    expect(schema.items.type).toEqual(['boolean', 'null', 'string']);
    expect(result.trustSummary?.unionTypeCount).toBe(1);
  });

  it('根数组会展示 SOURCE 多样本可信度', () => {
    const result = inferJsonSchemaFromText(JSON.stringify([
      { id: 1, title: 'A' },
      { id: 2, title: 'B', tag: 'new' },
    ]));

    expect(result.trustSummary).toMatchObject({
      sourceSampleCount: 2,
      sourceSampleUsedCount: 2,
      arrayTotalItemCount: 2,
      arraySampledItemCount: 2,
      optionalFieldCount: 1,
    });
  });

  it('空输入和非法 JSON 返回错误', () => {
    expect(inferJsonSchemaFromText('')).toMatchObject({
      error: '请先在 SOURCE 输入 JSON',
    });
    expect(inferJsonSchemaFromText('{bad}').error).toContain('SOURCE 不是合法 JSON');
  });
});
