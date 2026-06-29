import { describe, expect, it } from 'vitest';
import {
  parseFlatQueryParams,
} from './schemeFlatQueryParams';
import {
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

describe('schemeFlatQueryParams', () => {
  it('解析扁平 query 参数并合并重复 key', () => {
    expect(parseFlatQueryParams('?word=json+schema&amp;tag=a&tag=b', options)).toEqual({
      word: 'json schema',
      tag: ['a', 'b'],
    });
  });

  it('优先保留单个未编码 JSON 参数原文', () => {
    expect(parseFlatQueryParams('cmd={"a":"&from=feed"}', options)).toEqual({
      cmd: '{"a":"&from=feed"}',
    });
  });

  it('无有效参数时返回 undefined', () => {
    expect(parseFlatQueryParams('not-query', options)).toBeUndefined();
  });
});
