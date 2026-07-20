import { describe, expect, it } from 'vitest';
import { encodeWithLayers } from './schemeUtils';
import type { DecodeLayer } from './schemeTypes';
import {
  createSchemeViewerDecodeProjection,
  createSchemeViewerEncodingInput,
  restoreSchemeViewerDecodeProjection,
} from './schemeViewerDecodeProjection';

const HTTP_SOURCE = 'http://example.com/harmony/#/nativePhone?solutionId=2830284';
const HTTPS_SOURCE = 'https://example.com/path?name=demo';
const SCHEME_SOURCE = 'sampleapp://v7/vendor/ad/immersiveVideo?style=dark';

describe('schemeViewerDecodeProjection', () => {
  it('为 HTTP 和 HTTPS 地址添加 URL 前缀字段', () => {
    const httpResult = createSchemeViewerDecodeProjection('{"solutionId":"2830284"}', HTTP_SOURCE);
    const httpsResult = createSchemeViewerDecodeProjection('{"name":"demo"}', HTTPS_SOURCE);

    expect(JSON.parse(httpResult.content)).toEqual({
      __url__: 'http://example.com/harmony/',
      solutionId: '2830284',
    });
    expect(JSON.parse(httpsResult.content)).toEqual({
      __url__: 'https://example.com/path',
      name: 'demo',
    });
  });

  it('为自定义协议添加 Scheme 前缀字段', () => {
    const result = createSchemeViewerDecodeProjection('{"style":"dark"}', SCHEME_SOURCE);

    expect(result.headerKey).toBe('__scheme__');
    expect(JSON.parse(result.content)).toEqual({
      __scheme__: 'sampleapp://v7/vendor/ad/immersiveVideo',
      style: 'dark',
    });
  });

  it('非地址输入或非对象结果保持原文', () => {
    expect(createSchemeViewerDecodeProjection('[1,2]', HTTP_SOURCE)).toEqual({ content: '[1,2]' });
    expect(createSchemeViewerDecodeProjection('{"a":1}', 'a=1')).toEqual({ content: '{"a":1}' });
  });

  it('默认字段被占用时使用备用字段', () => {
    const result = createSchemeViewerDecodeProjection('{"__url__":"业务值"}', HTTP_SOURCE);

    expect(result.headerKey).toBe('__url_header__');
    expect(JSON.parse(result.content)).toEqual({
      __url_header__: 'http://example.com/harmony/',
      __url__: '业务值',
    });
  });

  it('两个候选字段都被占用时不覆盖业务数据', () => {
    const content = '{"__scheme__":"业务值","__scheme_header__":"备用业务值"}';

    expect(createSchemeViewerDecodeProjection(content, SCHEME_SOURCE)).toEqual({ content });
  });

  it('逆投影移除展示字段并保留业务参数', () => {
    const restored = restoreSchemeViewerDecodeProjection(
      '{"__url__":"http://example.com/harmony/","solutionId":"2830284"}',
      HTTP_SOURCE,
      '__url__',
    );

    expect(JSON.parse(restored.content)).toEqual({ solutionId: '2830284' });
    expect(restored.source).toBe(HTTP_SOURCE);
  });

  it('合法修改前缀时更新首个 URL 编码层', () => {
    const layers: DecodeLayer[] = [{
      type: 'url',
      before: HTTP_SOURCE,
      after: '{"solutionId":"2830284"}',
      description: 'URL 参数递归解析',
    }];
    const result = createSchemeViewerEncodingInput(
      '{"__url__":"https://example.com/new-path","solutionId":"2830284"}',
      HTTP_SOURCE,
      layers,
      '__url__',
    );

    expect(JSON.parse(result.content)).toEqual({ solutionId: '2830284' });
    expect(result.layers[0].before).toBe(
      'https://example.com/new-path#/nativePhone?solutionId=2830284',
    );
  });

  it('非法修改前缀时保留原始地址', () => {
    const restored = restoreSchemeViewerDecodeProjection(
      '{"__scheme__":"not-a-scheme","style":"light"}',
      SCHEME_SOURCE,
      '__scheme__',
    );

    expect(restored.source).toBe(SCHEME_SOURCE);
    expect(JSON.parse(restored.content)).toEqual({ style: 'light' });
  });

  it('形似协议的非法前缀不会破坏序列化结果', () => {
    const layers: DecodeLayer[] = [{
      type: 'url',
      before: HTTP_SOURCE,
      after: '{"solutionId":"2830284"}',
      description: 'URL 参数递归解析',
    }];
    const encodingInput = createSchemeViewerEncodingInput(
      '{"__url__":"https://[","solutionId":"999"}',
      HTTP_SOURCE,
      layers,
      '__url__',
    );

    expect(encodingInput.layers).toBe(layers);
    expect(encodeWithLayers(encodingInput.content, encodingInput.layers)).toBe(
      'http://example.com/harmony/#/nativePhone?solutionId=999',
    );
  });
});
