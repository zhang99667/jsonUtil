import { describe, expect, it } from 'vitest';
import {
  getSchemeCommandSchemaFromSource,
  getSchemeCommandSchemaFromUrl,
  getSchemeCommandSourceInfo,
  getSchemeMetadataSourceObjectChild,
  normalizeSchemeMetadataSourceString,
  parseSchemeMetadataSourceShape,
} from './schemeMetadataSourceShape';

describe('schemeMetadataSourceShape', () => {
  it('按出现顺序保留分号分隔的重复 Scheme 参数', () => {
    const first = 'sampleapp://v1/panel?from=first';
    const second = 'sampleapp://v1/panel?from=second';

    expect(parseSchemeMetadataSourceShape(
      `panel_scheme=${encodeURIComponent(first)};panel_scheme=${encodeURIComponent(second)}`
    )).toEqual({
      panel_scheme: [first, second],
    });
  });

  it('未编码 JSON 内部的连接符不会被误切成新参数', () => {
    expect(parseSchemeMetadataSourceShape(
      'params={"url":"https://example.com/page?a=1&b=2","flags":{"x":"a&b"}}&from=feed'
    )).toEqual({
      params: {
        url: 'https://example.com/page?a=1&b=2',
        flags: {
          x: 'a&b',
        },
      },
      from: 'feed',
    });
  });

  it('复用日志字段语法解析带前缀和引号的字段', () => {
    const source = 'sampleapp://v1/panel?from=log';

    expect(parseSchemeMetadataSourceShape(
      `I/SampleRender: "panel\\u005fscheme" = "${source.replace(/\//g, '\\/')}"`
    )).toEqual({
      panel_scheme: source,
    });
  });

  it('解析 URL、JSON 和嵌套来源子节点', () => {
    const source = 'sampleapp://v1/panel?from=json';
    const shape = parseSchemeMetadataSourceShape(JSON.stringify({
      panel_scheme: source,
      enabled: true,
    }));

    expect(getSchemeMetadataSourceObjectChild(shape, 'panel_scheme')).toBe(source);
    expect(getSchemeMetadataSourceObjectChild(shape, 'enabled')).toBe(true);
  });

  it('统一规范化来源并提取可执行命令信息', () => {
    const escaped = 'sampleapp:\\/\\/v1\\/panel?from=escaped';
    const encoded = encodeURIComponent('sampleapp://v1/panel?from=encoded');

    expect(normalizeSchemeMetadataSourceString(escaped)).toBe(
      'sampleapp://v1/panel?from=escaped'
    );
    expect(getSchemeCommandSchemaFromUrl(escaped)).toBe('sampleapp://v1/panel');
    expect(getSchemeCommandSchemaFromSource(encoded)).toBe('sampleapp://v1/panel');
    expect(getSchemeCommandSourceInfo(encoded)).toEqual({
      cmdSchema: 'sampleapp://v1/panel',
      source: 'sampleapp://v1/panel?from=encoded',
    });
  });
});
