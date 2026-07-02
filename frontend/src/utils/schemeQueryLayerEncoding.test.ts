import { describe, expect, it } from 'vitest';
import {
  encodeQueryStringLayerContent,
  type PrefixedQueryLookup,
} from './schemeQueryLayerEncoding';
import type {
  SchemeLayerEncodingOptions,
  SchemeLayerEncoder,
} from './schemeLayerEncoding';

const getPrefixedQueryString: PrefixedQueryLookup = source => (
  source.startsWith('LOG ')
    ? { prefix: 'LOG ', queryString: source.slice(4) }
    : null
);

const encodeWithLayers: SchemeLayerEncoder = content => `encoded(${content})`;

const createOptions = (
  parseLogFieldParamString: SchemeLayerEncodingOptions['parseLogFieldParamString'] = () => null
): SchemeLayerEncodingOptions => ({
  createRawParamOptions: () => ({
    decodeKey: value => decodeURIComponent(value),
    decodeValue: value => decodeURIComponent(value),
    isKnownParamName: key => key === 'url',
    isUrlValue: value => /^https?:\/\//.test(value),
    isJsonValue: () => false,
  }),
  decodeLayersForValue: () => [],
  getFragmentParamSource: () => null,
  parseLogFieldParamString,
  urlEncode: value => encodeURIComponent(value),
});

describe('schemeQueryLayerEncoding', () => {
  it('回写带日志前缀的 query-string layer', () => {
    const content = JSON.stringify({
      cmd: { a: 2 },
      from: 'panel',
    });

    expect(encodeQueryStringLayerContent(
      content,
      'LOG cmd=%7B%22a%22%3A1%7D&from=feed',
      getPrefixedQueryString,
      createOptions(),
      encodeWithLayers
    )).toBe('LOG cmd=%7B%22a%22%3A2%7D&from=panel');
  });

  it('回写日志字段时复用嵌套编码层', () => {
    const content = JSON.stringify({
      params: { a: 2 },
    });

    expect(encodeQueryStringLayerContent(
      content,
      'params: old,',
      getPrefixedQueryString,
      createOptions(() => ({
        rawKey: 'params',
        key: 'params',
        delimiter: ':',
        value: 'old',
        trailingComma: true,
      })),
      encodeWithLayers
    )).toBe('params: encoded({"a":2}),');
  });

  it('回写单个 raw URL 参数时保留原始 URL 参数形态', () => {
    const content = JSON.stringify({
      url: {
        sku: '202',
        store: 'new',
      },
    });

    expect(encodeQueryStringLayerContent(
      content,
      'url=https://example.com/landing?sku=101&store=old',
      getPrefixedQueryString,
      createOptions(),
      encodeWithLayers
    )).toBe('url=https://example.com/landing?sku=202&store=new');
  });

  it('回写带前缀的单个 raw URL 参数时保留前缀', () => {
    const content = JSON.stringify({
      url: {
        sku: '202',
      },
    });

    expect(encodeQueryStringLayerContent(
      content,
      'LOG url=https://example.com/landing?sku=101',
      getPrefixedQueryString,
      createOptions(),
      encodeWithLayers
    )).toBe('LOG url=https://example.com/landing?sku=202');
  });

  it('非 JSON 对象内容不参与 query-string 回写', () => {
    expect(encodeQueryStringLayerContent(
      'not json',
      'cmd=old',
      getPrefixedQueryString,
      createOptions(),
      encodeWithLayers
    )).toBeNull();
  });
});
