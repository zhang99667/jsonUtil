import { describe, expect, it } from 'vitest';
import { parseRawCmdUrlParts } from './cmdStructureRawUrl';

describe('cmdStructureRawUrl', () => {
  it('提取 CMD URL 的 schema 和原始 query', () => {
    expect(parseRawCmdUrlParts('baiduboxapp://v7/vendor/ad/prerender?params=%7B%7D')).toEqual({
      schema: 'baiduboxapp://v7/vendor/ad/prerender',
      query: '?params=%7B%7D',
    });
  });

  it('保留普通 HTTPS URL 的路径级 schema', () => {
    expect(parseRawCmdUrlParts('https://example.com/landing/page?sku=101#detail')).toEqual({
      schema: 'https://example.com/landing/page',
      query: '?sku=101',
    });
  });

  it('URL 构造失败时使用手动 query 截断并去掉 hash', () => {
    expect(parseRawCmdUrlParts('https://example.com:bad/path?sku=101#detail')).toEqual({
      schema: 'https://example.com:bad/path',
      query: 'sku=101',
    });
  });

  it('非 URL 文本不生成 URL parts', () => {
    expect(parseRawCmdUrlParts('foo=bar&baz=qux')).toBeNull();
  });
});
