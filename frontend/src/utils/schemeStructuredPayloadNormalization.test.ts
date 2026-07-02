import { describe, expect, it } from 'vitest';
import { getFirstSchemeStructuredPayloadNormalization } from './schemeStructuredPayloadNormalization';

const looksLikeStructuredPayload = (value: string): boolean => (
  value.startsWith('baiduboxapp://') ||
  value.startsWith('cmd=') ||
  value.startsWith('{')
);

const tryParseJsonStringPayload = (value: string): string | null => {
  try {
    const parsed: unknown = JSON.parse(value);
    return typeof parsed === 'string' && looksLikeStructuredPayload(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

const normalize = (value: string, includeQuotePayloads = true) => (
  getFirstSchemeStructuredPayloadNormalization(value, {
    includeQuotePayloads,
    looksLikeStructuredPayload,
    tryParseJsonStringPayload,
  })
);

describe('schemeStructuredPayloadNormalization', () => {
  it('优先解析 JSON 字符串字面量并生成展示层元信息', () => {
    expect(normalize(JSON.stringify('cmd=%7B%22a%22%3A1%7D'))).toEqual({
      source: 'json-string',
      value: 'cmd=%7B%22a%22%3A1%7D',
      layer: {
        type: 'json',
        description: 'JSON 字符串字面量解析',
      },
    });
  });

  it('识别 JSON 斜杠转义和 Unicode ASCII 转义载荷', () => {
    expect(normalize('baiduboxapp:\\/\\/v1\\/open?cmd=%7B%7D')).toMatchObject({
      source: 'json-escaped-slash',
      value: 'baiduboxapp://v1/open?cmd=%7B%7D',
      layer: {
        type: 'json-escaped-slash',
      },
    });
    expect(normalize('cmd\\u003d%7B%7D\\u0026from\\u003dlog')).toMatchObject({
      source: 'json-unicode-ascii',
      value: 'cmd=%7B%7D&from=log',
      layer: {
        type: 'json-unicode-ascii',
        reversible: false,
      },
    });
  });

  it('反斜杠引号和 HTML 引号只做内部规范化，不生成展示层', () => {
    expect(normalize('{\\"a\\":1}')).toEqual({
      source: 'json-escaped-quote',
      value: '{"a":1}',
    });
    expect(normalize('{&quot;a&quot;:1}')).toEqual({
      source: 'html-json-quote',
      value: '{"a":1}',
    });
  });

  it('可关闭 quote 类规范化以保持递归解码 layer 行为稳定', () => {
    expect(normalize('{\\"a\\":1}', false)).toBeNull();
  });
});
