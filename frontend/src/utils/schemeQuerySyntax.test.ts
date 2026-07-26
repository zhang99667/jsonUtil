import { describe, expect, it, vi } from 'vitest';
import {
  iterateDecodedQueryPairs,
  looksLikeQueryString,
  normalizeQueryString,
  splitQueryPairs,
  stripQueryPrefix,
} from './schemeQuerySyntax';

describe('schemeQuerySyntax', () => {
  it('归一化常见日志 query 分隔符和实体', () => {
    expect(normalizeQueryString('cmd&#61;1&#38;from&#61;log')).toBe('cmd=1&from=log');
    expect(normalizeQueryString('cmd\\u003d1\\u0026from\\u003dlog')).toBe('cmd=1&from=log');
    expect(normalizeQueryString('cmd=1;from=log')).toBe('cmd=1&from=log');
    expect(normalizeQueryString('cmd=1, from=log')).toBe('cmd=1&from=log');
    expect(normalizeQueryString('cmd=1\\n  from=log')).toBe('cmd=1&from=log');
  });

  it('统一迭代已解码参数并保留原始键值', () => {
    expect([...iterateDecodedQueryPairs(
      '?word=json+schema&empty=&next=1',
      value => decodeURIComponent(value),
      value => decodeURIComponent(value.replace(/\+/g, ' ')),
    )]).toEqual([
      {
        rawKey: 'word',
        key: 'word',
        rawValue: 'json+schema',
        value: 'json schema',
      },
      {
        rawKey: 'empty',
        key: 'empty',
        rawValue: '',
        value: '',
      },
      {
        rawKey: 'next',
        key: 'next',
        rawValue: '1',
        value: '1',
      },
    ]);
  });

  it('达到上限后不再解码后续参数', () => {
    const decodeValue = vi.fn((value: string) => value);

    expect([...iterateDecodedQueryPairs(
      'first=1&second=2',
      value => value,
      decodeValue,
      1,
    )]).toHaveLength(1);
    expect(decodeValue).toHaveBeenCalledTimes(1);
  });

  it('剥离 query 前缀并识别参数串形态', () => {
    expect(stripQueryPrefix('??cmd=1')).toBe('?cmd=1');
    expect(stripQueryPrefix('&&cmd=1')).toBe('cmd=1');
    expect(looksLikeQueryString('?cmd=1')).toBe(true);
    expect(looksLikeQueryString('plain text')).toBe(false);
  });

  it('拆分 query pair 时保留原始 JSON 值里的分隔符', () => {
    expect(splitQueryPairs('params={"url":"https://example.com?a=1&b=2","list":[1,2]}&from=log')).toEqual([
      'params={"url":"https://example.com?a=1&b=2","list":[1,2]}',
      'from=log',
    ]);
  });

  it('支持多种分隔符拆分 query pair', () => {
    expect(splitQueryPairs('cmd=1;from=log, ext=2\\n  trace=3')).toEqual([
      'cmd=1',
      'from=log',
      'ext=2',
      'trace=3',
    ]);
  });
});
