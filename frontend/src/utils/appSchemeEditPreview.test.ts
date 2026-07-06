import { describe, expect, it } from 'vitest';
import { applySchemeEditToPreviewText } from './appSchemeEditPreview';

const formattedJson = (value: unknown) => JSON.stringify(value, null, 2);

describe('applySchemeEditToPreviewText', () => {
  it('优先按 JSON Pointer 精确写回 PREVIEW', () => {
    expect(applySchemeEditToPreviewText({
      previewText: '{"data":{"url":"old"}}',
      jsonPath: '$.data.url',
      newValue: 'new',
      pointer: '/data/url',
    })).toBe(formattedJson({ data: { url: 'new' } }));
  });

  it('没有 pointer 时兼容旧 JSONPath 写回', () => {
    expect(applySchemeEditToPreviewText({
      previewText: '{"list":[{"url":"old"}]}',
      jsonPath: '$.list[0].url',
      newValue: 'new',
    })).toBe(formattedJson({ list: [{ url: 'new' }] }));
  });

  it('PREVIEW 无法解析时抛出解析错误', () => {
    expect(() => applySchemeEditToPreviewText({
      previewText: '{bad json',
      jsonPath: '$.data.url',
      newValue: 'new',
      pointer: '/data/url',
    })).toThrow(SyntaxError);
  });

  it('JSON Pointer 写入失败时不回退旧 JSONPath', () => {
    expect(() => applySchemeEditToPreviewText({
      previewText: '{"items":["old"]}',
      jsonPath: '$.items[0]',
      newValue: 'new',
      pointer: '/items/bad',
    })).toThrow('非法数组下标');
  });
});
