import { describe, expect, it } from 'vitest';
import { decodeQueryComponent, decodeQueryValueComponent } from './schemeQueryDecoding';
import { tryParseJson, tryParseJsonWithMeta } from './schemeJsonPayloads';
import {
  buildQueryStringParamDecodeStages,
  buildUrlParamDecodeStages,
  formatPlaceholderPathSegment,
} from './schemeParamDecodeStages';

const createOptions = () => ({
  decodeKey: decodeQueryComponent,
  decodeValue: (value: string) => decodeQueryValueComponent(value, () => true),
  decodeNestedValue: (value: string) => tryParseJson(value) ?? value,
  getFragmentParamSource: (value: string) => {
    if (!value.startsWith('#')) return null;
    const source = value.slice(1);
    return source.includes('=') ? source : null;
  },
  getPrefixedQueryString: (value: string) => (
    value.startsWith('cmd:')
      ? { queryString: value.slice('cmd:'.length) }
      : null
  ),
  parseLogFieldParamString: (value: string) => (
    value.startsWith('log=')
      ? { key: 'log', value: value.slice('log='.length) }
      : null
  ),
  tryParseJsonWithMeta,
  urlEncode: encodeURIComponent,
});

describe('schemeParamDecodeStages', () => {
  it('构建普通 query 参数分层证据并保留 loose JSON 修复提示', () => {
    const stages = buildQueryStringParamDecodeStages(
      'params=%7Bfoo%3A1%2C%7D&source=test',
      10,
      createOptions()
    );

    expect(stages[0]).toMatchObject({
      path: '$.params',
      key: 'params',
      source: 'query',
      raw: '%7Bfoo%3A1%2C%7D',
      urlDecoded: '{foo:1,}',
      parsed: expect.stringContaining('"foo": 1'),
      repairHint: 'Loose JSON 已补齐字段引号/单引号/尾逗号',
      reversible: false,
    });
    expect(stages[1]).toMatchObject({
      path: '$.source',
      key: 'source',
      source: 'query',
      raw: 'test',
      parsed: 'test',
      reversible: true,
    });
  });

  it('构建 URL query 与 hash 参数分层证据', () => {
    const stages = buildUrlParamDecodeStages(
      'baiduboxapp://v1/open?url=https%3A%2F%2Fm.baidu.com#tab=feed',
      10,
      createOptions()
    );

    expect(stages).toEqual([
      expect.objectContaining({
        path: '$.url',
        key: 'url',
        source: 'query',
        urlDecoded: 'https://m.baidu.com',
      }),
      expect.objectContaining({
        path: '$._hash.tab',
        key: 'tab',
        source: 'hash',
        urlDecoded: 'feed',
      }),
    ]);
  });

  it('格式化可读和不可读路径段', () => {
    expect(formatPlaceholderPathSegment('params')).toBe('.params');
    expect(formatPlaceholderPathSegment('cmd-url')).toBe('["cmd-url"]');
  });
});
