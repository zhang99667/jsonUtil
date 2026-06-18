import { describe, expect, it } from 'vitest';
import {
  formatJsonSchemaValidationReport,
  jsonPointerToJsonPath,
  validateJsonAgainstSchema,
} from './jsonSchemaValidation';
import { getJsonSchemaIssueHighlights } from './jsonSchemaIssueHighlights';

describe('jsonSchemaValidation', () => {
  const schema = JSON.stringify({
    type: 'object',
    required: ['name', 'items'],
    properties: {
      name: { type: 'string' },
      items: {
        type: 'array',
        items: {
          type: 'object',
          required: ['price'],
          properties: {
            price: { type: 'number', minimum: 1 },
          },
        },
      },
    },
  });

  it('合法 JSON 通过 Schema 校验', () => {
    const result = validateJsonAgainstSchema(
      JSON.stringify({ name: '订单', items: [{ price: 9.9 }] }),
      schema
    );

    expect(result).toMatchObject({
      status: 'valid',
      isValid: true,
      issueCount: 0,
      summary: '当前 JSON 符合 Schema',
    });
  });

  it('返回 Schema 校验问题和 JSONPath 路径', () => {
    const result = validateJsonAgainstSchema(
      JSON.stringify({ name: '订单', items: [{ price: 0 }, {}] }),
      schema
    );

    expect(result.status).toBe('invalid');
    expect(result.isValid).toBe(false);
    expect(result.issueCount).toBe(2);
    expect(result.issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        path: '$.items[0].price',
        pointer: '/items/0/price',
        keyword: 'minimum',
      }),
      expect.objectContaining({
        path: '$.items[1]',
        pointer: '/items/1',
        keyword: 'required',
      }),
    ]));
  });

  it('把 Schema 问题映射成编辑器高亮范围', () => {
    const jsonText = JSON.stringify({
      name: '订单',
      items: [{ price: 0 }],
    }, null, 2);
    const result = validateJsonAgainstSchema(jsonText, schema);
    const highlights = getJsonSchemaIssueHighlights(jsonText, result);

    expect(highlights).toHaveLength(1);
    expect(highlights[0].issue.path).toBe('$.items[0].price');
    expect(highlights[0].range.startLine).toBeGreaterThan(1);
    expect(highlights[0].range.startColumn).toBeGreaterThan(1);
  });

  it('额外字段问题优先定位到具体字段', () => {
    const jsonText = JSON.stringify({
      id: 1,
      extra: true,
    }, null, 2);
    const result = validateJsonAgainstSchema(jsonText, JSON.stringify({
      type: 'object',
      properties: {
        id: { type: 'number' },
      },
      additionalProperties: false,
    }));

    expect(result.issues[0]).toMatchObject({
      path: '$.extra',
      pointer: '/extra',
      keyword: 'additionalProperties',
    });
    expect(getJsonSchemaIssueHighlights(jsonText, result)[0].range.startLine).toBe(3);
  });

  it('区分 SOURCE JSON 错误和 Schema JSON 错误', () => {
    expect(validateJsonAgainstSchema('{bad}', schema)).toMatchObject({
      status: 'input-error',
      isValid: false,
    });

    expect(validateJsonAgainstSchema('{"ok":true}', '{bad}')).toMatchObject({
      status: 'schema-error',
      isValid: false,
    });
  });

  it('支持 2020-12 Schema', () => {
    const result = validateJsonAgainstSchema(
      JSON.stringify({ type: 'book', title: 'JSON' }),
      JSON.stringify({
        $schema: 'https://json-schema.org/draft/2020-12/schema',
        type: 'object',
        dependentRequired: {
          type: ['id'],
        },
      })
    );

    expect(result.status).toBe('invalid');
    expect(result.issues[0]).toMatchObject({
      path: '$',
      keyword: 'dependentRequired',
    });
  });

  it('把 JSON Pointer 转成可读 JSONPath', () => {
    expect(jsonPointerToJsonPath('')).toBe('$');
    expect(jsonPointerToJsonPath('/items/0/price')).toBe('$.items[0].price');
    expect(jsonPointerToJsonPath('/a~1b/weird-key')).toBe('$["a/b"]["weird-key"]');
  });

  it('复制报告不包含原始 JSON 或 Schema', () => {
    const result = validateJsonAgainstSchema(
      JSON.stringify({ name: '订单', items: [{ price: 0 }] }),
      schema
    );
    const report = formatJsonSchemaValidationReport(result);

    expect(report).toContain('JSON Schema 校验报告');
    expect(report).toContain('$.items[0].price [minimum]');
    expect(report).not.toContain('"订单"');
    expect(report).not.toContain('"required"');
  });
});
