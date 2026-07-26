import { describe, expect, it } from 'vitest';
import { TransformMode, type JsonValue } from '../types';
import { buildJsonTreeModel } from './jsonTreeModel';
import { prepareSchemeDisplayEncoding } from './schemeDisplayEncoding';
import {
  buildSchemeDisplayProjection,
  createSchemeDecodeDisplayContext,
  stripSchemeDisplayHeaders,
} from './schemeDisplayProjection';
import { performTransform, validateJson } from './transformations';

const OVERFLOW_JSON = '{"value":1e400}';
const DISPLAY_HEADER = {
  path: '',
  headerKey: '__scheme__',
  header: 'sampleapp://v1/open',
  source: 'sampleapp://v1/open?value=1',
  layers: [],
};

describe('JSON 值消费边界', () => {
  it('核心转换拒绝指数溢出的数值', () => {
    const result = validateJson(OVERFLOW_JSON);

    expect(result.isValid).toBe(false);
    expect(result.error).toContain('JSON 包含不支持的值');
    expect(performTransform(OVERFLOW_JSON, TransformMode.FORMAT)).toBe(OVERFLOW_JSON);
  });

  it('Scheme 展示投影拒绝指数溢出的数值', () => {
    expect(buildSchemeDisplayProjection(
      OVERFLOW_JSON,
      createSchemeDecodeDisplayContext(),
    )).toBeNull();
  });

  it('Scheme 展示清理和反向编码安全回退原文', () => {
    const content = '{"__scheme__":"sampleapp://v1/open","value":1e400}';

    expect(stripSchemeDisplayHeaders(content, [DISPLAY_HEADER])).toBe(content);
    expect(prepareSchemeDisplayEncoding(
      content,
      [],
      [DISPLAY_HEADER],
      (value: JsonValue) => JSON.stringify(value),
    )).toEqual({ safe: false });
  });

  it('结构导航拒绝指数溢出的数值', () => {
    expect(() => buildJsonTreeModel(OVERFLOW_JSON)).toThrow(
      'JSON 结构解析失败: JSON 包含不支持的值',
    );
  });
});
