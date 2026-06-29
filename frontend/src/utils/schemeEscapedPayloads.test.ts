import { describe, expect, it } from 'vitest';
import {
  normalizeJsonEscapedSlashes,
  normalizeJsonUnicodeAsciiEscapes,
  tryNormalizeJsonEscapedSlashPayload,
  tryNormalizeJsonUnicodeAsciiPayload,
} from './schemeEscapedPayloads';

const looksLikeStructuredPayload = (value: string): boolean => (
  value.startsWith('baiduboxapp://') || value.startsWith('cmd=')
);

describe('schemeEscapedPayloads', () => {
  it('还原 JSON 斜杠转义和 Unicode ASCII 转义', () => {
    expect(normalizeJsonEscapedSlashes('baiduboxapp:\\/\\/v1\\/open')).toBe('baiduboxapp://v1/open');
    expect(normalizeJsonUnicodeAsciiEscapes('cmd\\u003d1\\u0026from\\u003dlog')).toBe('cmd=1&from=log');
  });

  it('只返回可继续解析的 JSON 斜杠转义载荷', () => {
    expect(tryNormalizeJsonEscapedSlashPayload(
      'baiduboxapp:\\/\\/v1\\/open',
      looksLikeStructuredPayload
    )).toBe('baiduboxapp://v1/open');
    expect(tryNormalizeJsonEscapedSlashPayload('plain\\/text', looksLikeStructuredPayload)).toBeNull();
  });

  it('只返回可继续解析的 JSON Unicode ASCII 载荷', () => {
    expect(tryNormalizeJsonUnicodeAsciiPayload(
      'cmd\\u003d1\\u0026from\\u003dlog',
      looksLikeStructuredPayload
    )).toBe('cmd=1&from=log');
    expect(tryNormalizeJsonUnicodeAsciiPayload('plain\\u002ftext', looksLikeStructuredPayload)).toBeNull();
  });
});
