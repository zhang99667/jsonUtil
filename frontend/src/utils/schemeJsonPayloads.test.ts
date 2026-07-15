import { describe, expect, it } from 'vitest';
import {
  isJsonString,
  normalizeHtmlJsonQuoteCandidate,
  normalizeJsonEscapedQuoteCandidate,
  normalizeLooseJsonCandidate,
  tryNormalizeHtmlJsonQuotePayload,
  tryNormalizeJsonEscapedQuotePayload,
  tryParseJson,
  tryParseJsonWithMeta,
} from './schemeJsonPayloads';

describe('schemeJsonPayloads', () => {
  it('识别严格 JSON 对象和数组', () => {
    expect(isJsonString('{"key":"value"}')).toBe(true);
    expect(isJsonString('[1,2,3]')).toBe(true);
    expect(isJsonString('{invalid}')).toBe(false);
    expect(isJsonString('"plain"')).toBe(false);
  });

  it('归一化 loose JSON 字段引号、单引号和尾逗号', () => {
    const normalized = normalizeLooseJsonCandidate("{title:'标题',enabled:true,}");

    expect(normalized).toBe('{"title":"标题","enabled":true}');
    expect(tryParseJson(normalized!)).toEqual({ title: '标题', enabled: true });
  });

  it('还原 HTML 引号实体并在需要时继续 loose JSON 修复', () => {
    expect(normalizeHtmlJsonQuoteCandidate('{&quot;title&quot;:&quot;标题&quot;}'))
      .toBe('{"title":"标题"}');
    expect(tryNormalizeHtmlJsonQuotePayload('{&#x27;title&#x27;:&#x27;标题&#x27;}'))
      .toBe('{"title":"标题"}');
  });

  it('还原 JSON 片段中的反斜杠引号和转义斜杠', () => {
    expect(normalizeJsonEscapedQuoteCandidate('{\\"url\\":\\"https:\\/\\/m.example.com\\"}'))
      .toBe('{"url":"https://m.example.com"}');
    expect(tryNormalizeJsonEscapedQuotePayload('{\\"title\\":\\"标题\\"}'))
      .toBe('{"title":"标题"}');
  });

  it('返回 JSON 修复策略元信息', () => {
    expect(tryParseJsonWithMeta('{"a":1}')).toMatchObject({
      value: { a: 1 },
      strategy: 'strict',
    });
    expect(tryParseJsonWithMeta("{a:'1',}")).toMatchObject({
      value: { a: '1' },
      strategy: 'loose-json',
      normalized: '{"a":"1"}',
    });
  });
});
