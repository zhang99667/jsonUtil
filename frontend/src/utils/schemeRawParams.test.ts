import { describe, expect, it } from 'vitest';
import {
  getSingleRawStructuredParam,
  getSingleRawUrlParam,
  type SchemeRawParamOptions,
} from './schemeRawParams';

const decodeUrl = (value: string): string => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

const options: SchemeRawParamOptions = {
  decodeKey: value => decodeUrl(value.replace(/\+/g, ' ')),
  decodeValue: value => decodeUrl(value.replace(/\+/g, ' ')),
  isKnownParamName: key => ['cmd', 'url', 'redirect'].includes(key),
  isUrlValue: value => /^https?:\/\//.test(value),
  isJsonValue: value => {
    try {
      JSON.parse(value);
      return true;
    } catch {
      return false;
    }
  },
};

describe('schemeRawParams', () => {
  it('识别包含 query 形态内容的单个未编码 JSON 参数', () => {
    expect(getSingleRawStructuredParam('cmd={"a":"&from=feed"}', options)).toEqual({
      key: 'cmd',
      value: '{"a":"&from=feed"}',
    });
  });

  it('普通多参数串不误判为单个未编码 JSON 结构化参数', () => {
    expect(getSingleRawStructuredParam('cmd={"a":1}&from=feed', options)).toBeNull();
  });

  it('识别单个未编码 URL 参数并保留原始 key', () => {
    expect(getSingleRawUrlParam('url=https://example.com/a?b=1&c=2', options)).toEqual({
      rawKey: 'url',
      key: 'url',
      value: 'https://example.com/a?b=1&c=2',
    });
  });

  it('识别不包含外层分隔符的单个未编码 URL 参数', () => {
    expect(getSingleRawUrlParam('url=https://example.com/a?b=1', options)).toEqual({
      rawKey: 'url',
      key: 'url',
      value: 'https://example.com/a?b=1',
    });
  });

  it('空 key 和未知 key 不会被识别为单个原始参数', () => {
    expect(getSingleRawStructuredParam('= {"a":1}', options)).toBeNull();
    expect(getSingleRawUrlParam('unknown=https://example.com/a', options)).toBeNull();
  });
});
