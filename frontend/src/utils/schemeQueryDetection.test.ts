import { describe, expect, it } from 'vitest';
import {
  getSchemePrefixedQueryString,
  isDecodableSchemePrefixedQueryString,
  isDecodableSchemeQueryString,
  isSchemeQueryStringFormat,
  type SchemeQueryDetectionOptions,
} from './schemeQueryDetection';

const options: SchemeQueryDetectionOptions = {
  isKnownParamName: key => ['cmd', 'url', 'next'].includes(key),
  isDecodableValue: value => (
    value.includes('%7B') ||
    value.includes('://') ||
    value.startsWith('#')
  ),
};

describe('schemeQueryDetection', () => {
  it('识别多参数 query 格式但不把单参数和 URL 当作普通 query 格式', () => {
    expect(isSchemeQueryStringFormat('key=value&name=test')).toBe(true);
    expect(isSchemeQueryStringFormat('key=value')).toBe(false);
    expect(isSchemeQueryStringFormat('https://example.com/path?key=value&name=test')).toBe(false);
  });

  it('按注入策略识别可继续解析的单参数 query', () => {
    expect(isDecodableSchemeQueryString('cmd=%7B%22a%22%3A1%7D', options)).toBe(true);
    expect(isDecodableSchemeQueryString('url=https%3A%2F%2Fexample.com', options)).toBe(false);
    expect(isDecodableSchemeQueryString('url=https://example.com', options)).toBe(true);
    expect(isDecodableSchemeQueryString('title=plain', options)).toBe(false);
  });

  it('提取带日志前缀的可解析 query 串', () => {
    expect(getSchemePrefixedQueryString('I/SampleRender: cmd=%7B%22a%22%3A1%7D', options)).toEqual({
      prefix: 'I/SampleRender: ',
      queryString: 'cmd=%7B%22a%22%3A1%7D',
    });
    expect(isDecodableSchemePrefixedQueryString('I/SampleRender: cmd=%7B%22a%22%3A1%7D', options)).toBe(true);
  });

  it('普通 query 和不可解析前缀 query 不会命中前缀提取', () => {
    expect(getSchemePrefixedQueryString('cmd=%7B%22a%22%3A1%7D', options)).toBeNull();
    expect(getSchemePrefixedQueryString('I/SampleRender: title=plain', options)).toBeNull();
  });
});
