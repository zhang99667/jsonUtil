import { describe, expect, it } from 'vitest';
import type { SchemeRawParamOptions } from './schemeRawParams';
import { parseSchemeUrlInfo } from './schemeUrlInfo';

const decode = (value: string): string => decodeURIComponent(value.replace(/\+/g, ' '));

const rawParamOptions: SchemeRawParamOptions = {
  decodeKey: decode,
  decodeValue: decode,
  isKnownParamName: () => true,
  isUrlValue: () => false,
  isJsonValue: () => false,
};

const getFragmentParamSource = (hash: string): string | null => {
  const queryIndex = hash.indexOf('?');
  if (queryIndex < 0) return null;
  return hash.slice(queryIndex + 1);
};

describe('parseSchemeUrlInfo', () => {
  it('解析协议相对 URL 与 hash route 参数', () => {
    const result = parseSchemeUrlInfo(
      '//m.baidu.com/s?word=json+schema#/detail?cmd=%7B%22a%22%3A1%7D',
      { rawParamOptions, getFragmentParamSource }
    );

    expect(result).toEqual({
      protocol: '//',
      host: 'm.baidu.com',
      path: '/s',
      hash: '/detail?cmd=%7B%22a%22%3A1%7D',
      params: { word: 'json schema' },
      hashParams: { cmd: '{"a":1}' },
    });
  });

  it('无效 URL 返回 null', () => {
    expect(parseSchemeUrlInfo('not a url', { rawParamOptions, getFragmentParamSource })).toBeNull();
  });
});
