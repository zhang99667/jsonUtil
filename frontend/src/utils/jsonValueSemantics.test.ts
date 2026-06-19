import { describe, expect, it } from 'vitest';
import { getJsonStringSemanticHints } from './jsonValueSemantics';

describe('jsonValueSemantics', () => {
  it('识别普通 HTTPS URL 但不把它标记为业务 Scheme', () => {
    expect(getJsonStringSemanticHints('https://example.com/docs?a=1#top')).toEqual([
      {
        kind: 'url',
        label: 'URL',
        detail: 'example.com/docs#...',
      },
    ]);
  });

  it('识别自定义 Scheme、邮箱、日期和颜色', () => {
    expect(getJsonStringSemanticHints('baiduboxapp://v7/vendor/ad')).toEqual([
      {
        kind: 'scheme',
        label: 'Scheme',
        detail: 'v7/vendor/ad',
      },
    ]);
    expect(getJsonStringSemanticHints('dev@example.com')).toEqual([
      {
        kind: 'email',
        label: '邮箱',
        detail: 'dev@example.com',
      },
    ]);
    expect(getJsonStringSemanticHints('2026-06-19T17:58:00Z')).toEqual([
      {
        kind: 'date-time',
        label: '日期时间',
        detail: '2026-06-19 17:58:00Z',
      },
    ]);
    expect(getJsonStringSemanticHints('#12abef')).toEqual([
      {
        kind: 'color',
        label: '颜色',
        detail: '#12ABEF',
      },
    ]);
  });

  it('忽略非字符串、空字符串和非法日期', () => {
    expect(getJsonStringSemanticHints(123)).toEqual([]);
    expect(getJsonStringSemanticHints('   ')).toEqual([]);
    expect(getJsonStringSemanticHints('2026-02-31')).toEqual([]);
  });
});
