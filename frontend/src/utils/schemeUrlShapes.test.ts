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
    expect(normalizeJsonUrlEscapes('sampleapp:\\/\\/v1\\/open')).toBe('sampleapp://v1/open');
    expect(normalizeJsonUrlEscapes('sampleapp\\u003a\\u002f\\u002fv1\\u002fopen')).toBe('sampleapp://v1/open');
  });

  it('识别协议相对 URL 和裸域名 URL', () => {
    expect(isProtocolRelativeUrl('//m.example.com/s?word=json')).toBe(true);
    expect(isProtocolRelativeUrl('//not-host/path')).toBe(false);
    expect(isBareHostUrl('m.example.com/s?word=json')).toBe(true);
    expect(isBareHostUrl('localhost:5173/app?tab=scheme')).toBe(true);
    expect(isBareHostUrl('foo.bar')).toBe(false);
  });

  it('创建 URL 时补齐协议但保留解析结果', () => {
    expect(createUrl('//m.example.com/s?word=json').host).toBe('m.example.com');
    expect(createUrl('m.example.com/s?word=json').protocol).toBe('https:');
    expect(createUrl('sampleapp://v1/open').protocol).toBe('sampleapp:');
  });

  it('按原始 URL 形态序列化', () => {
    const bareUrl = createUrl('m.example.com/s?word=json');
    bareUrl.searchParams.set('word', 'json2');
    expect(stringifyUrlForOriginalShape(bareUrl, 'm.example.com/s?word=json')).toBe('m.example.com/s?word=json2');

    const protocolRelativeUrl = createUrl('//m.example.com/s?word=json');
    protocolRelativeUrl.searchParams.set('word', 'json2');
    expect(stringifyUrlForOriginalShape(protocolRelativeUrl, '//m.example.com/s?word=json')).toBe('//m.example.com/s?word=json2');
  });

  it('识别 HTTP(S) 协议', () => {
    expect(isHttpSchemeProtocol('https:')).toBe(true);
    expect(isHttpSchemeProtocol('HTTP:')).toBe(true);
    expect(isHttpSchemeProtocol('sampleapp:')).toBe(false);
  });
});
