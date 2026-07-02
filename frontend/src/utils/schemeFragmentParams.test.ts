import { describe, expect, it } from 'vitest';
import {
  getFragmentParamSource,
  getFragmentParamSourceInfo,
  isDecodableFragmentParamString,
} from './schemeFragmentParams';

const decodeUrl = (value: string): string => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

const isDecodableQueryString = (value: string): boolean => (
  /(?:^|[&?])cmd=/.test(value) || /(?:^|[&?])unit=/.test(value)
);

describe('schemeFragmentParams', () => {
  it('提取 hash route 中的参数源并保留 route 前缀', () => {
    expect(getFragmentParamSourceInfo('#/detail?cmd=1&from=hash', decodeUrl)).toEqual({
      source: 'cmd=1&from=hash',
      prefix: '/detail?',
    });
  });

  it('提取锚点后继续拼接的参数源', () => {
    expect(getFragmentParamSourceInfo('zzzaz1)&unit=单元&keyword=json', decodeUrl)).toEqual({
      source: 'unit=单元&keyword=json',
      prefix: 'zzzaz1)&',
    });
  });

  it('支持先 URL Decode 再识别 fragment 参数', () => {
    const encodedFragment = encodeURIComponent('/detail?cmd=1&from=hash');

    expect(getFragmentParamSource(encodedFragment, decodeUrl)).toBe('cmd=1&from=hash');
  });

  it('支持问号后带多余 & 的 fragment 参数源', () => {
    expect(getFragmentParamSourceInfo('/detail?&cmd=1&from=hash', decodeUrl)).toEqual({
      source: '&cmd=1&from=hash',
      prefix: '/detail?',
    });
  });

  it('支持裸 query 参数源并保持嵌入参数优先级', () => {
    expect(getFragmentParamSourceInfo('cmd=1', decodeUrl)).toEqual({
      source: 'cmd=1',
      prefix: '',
    });
    expect(getFragmentParamSourceInfo('cmd=1&from=hash', decodeUrl)).toEqual({
      source: 'from=hash',
      prefix: 'cmd=1&',
    });
    expect(getFragmentParamSourceInfo('section-one', decodeUrl)).toBeNull();
  });

  it('只把 fragment 形态中的可解析参数串识别为 decodable', () => {
    expect(isDecodableFragmentParamString('#/detail?cmd=1&from=hash', {
      decodeUrl,
      isDecodableQueryString,
    })).toBe(true);
    expect(isDecodableFragmentParamString('note?cmd=1&from=text', {
      decodeUrl,
      isDecodableQueryString,
    })).toBe(false);
  });
});
