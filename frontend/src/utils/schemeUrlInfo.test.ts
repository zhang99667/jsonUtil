import { describe, expect, it } from 'vitest';
import type { SchemeRawParamOptions } from './schemeRawParams';
import {
  parseSchemeUrlInfo,
  parseSchemeUrlInfoFromContext,
} from './schemeUrlInfo';
import { createSchemeUrlContext } from './schemeUrlShapes';

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
      '//m.example.com/s?word=json+schema#/detail?cmd=%7B%22a%22%3A1%7D',
      { rawParamOptions, getFragmentParamSource }
    );

    expect(result).toEqual({
      protocol: '//',
      host: 'm.example.com',
      path: '/s',
      hash: '/detail?cmd=%7B%22a%22%3A1%7D',
      params: { word: 'json schema' },
      hashParams: { cmd: '{"a":1}' },
    });
  });

  it('无效 URL 返回 null', () => {
    expect(parseSchemeUrlInfo('not a url', { rawParamOptions, getFragmentParamSource })).toBeNull();
  });

  it('复用解析上下文时保持 URL 信息结果一致', () => {
    const source = 'sampleapp://v1/open?word=json+schema#/detail?tab=feed';
    const options = { rawParamOptions, getFragmentParamSource };

    expect(parseSchemeUrlInfoFromContext(createSchemeUrlContext(source), options)).toEqual(
      parseSchemeUrlInfo(source, options),
    );
  });
});
