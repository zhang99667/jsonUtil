import { describe, expect, it } from 'vitest';
import {
  createUrl,
  isBareHostUrl,
  isHttpSchemeProtocol,
  isProtocolRelativeUrl,
  normalizeJsonUrlEscapes,
  stringifyUrlForOriginalShape,
} from './schemeUrlShapes';

describe('schemeUrlShapes', () => {
  it('归一化 JSON 风格转义 URL', () => {
    expect(normalizeJsonUrlEscapes('baiduboxapp:\\/\\/v1\\/open')).toBe('baiduboxapp://v1/open');
    expect(normalizeJsonUrlEscapes('baiduboxapp\\u003a\\u002f\\u002fv1\\u002fopen')).toBe('baiduboxapp://v1/open');
  });

  it('识别协议相对 URL 和裸域名 URL', () => {
    expect(isProtocolRelativeUrl('//m.baidu.com/s?word=json')).toBe(true);
    expect(isProtocolRelativeUrl('//not-host/path')).toBe(false);
    expect(isBareHostUrl('m.baidu.com/s?word=json')).toBe(true);
    expect(isBareHostUrl('localhost:5173/app?tab=scheme')).toBe(true);
    expect(isBareHostUrl('foo.bar')).toBe(false);
  });

  it('创建 URL 时补齐协议但保留解析结果', () => {
    expect(createUrl('//m.baidu.com/s?word=json').host).toBe('m.baidu.com');
    expect(createUrl('m.baidu.com/s?word=json').protocol).toBe('https:');
    expect(createUrl('baiduboxapp://v1/open').protocol).toBe('baiduboxapp:');
  });

  it('按原始 URL 形态序列化', () => {
    const bareUrl = createUrl('m.baidu.com/s?word=json');
    bareUrl.searchParams.set('word', 'json2');
    expect(stringifyUrlForOriginalShape(bareUrl, 'm.baidu.com/s?word=json')).toBe('m.baidu.com/s?word=json2');

    const protocolRelativeUrl = createUrl('//m.baidu.com/s?word=json');
    protocolRelativeUrl.searchParams.set('word', 'json2');
    expect(stringifyUrlForOriginalShape(protocolRelativeUrl, '//m.baidu.com/s?word=json')).toBe('//m.baidu.com/s?word=json2');
  });

  it('识别 HTTP(S) 协议', () => {
    expect(isHttpSchemeProtocol('https:')).toBe(true);
    expect(isHttpSchemeProtocol('HTTP:')).toBe(true);
    expect(isHttpSchemeProtocol('baiduboxapp:')).toBe(false);
  });
});
