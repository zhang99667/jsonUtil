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

  it('结合字段上下文识别电话并遮罩手机号', () => {
    expect(getJsonStringSemanticHints('13718164578', { path: '$.phone', keyLabel: 'phone' })).toEqual([
      {
        kind: 'phone',
        label: '电话',
        detail: '137****4578',
      },
    ]);
    expect(getJsonStringSemanticHints('+86 13718164578', { path: '$.user.realPhone', keyLabel: 'realPhone' })).toEqual([
      {
        kind: 'phone',
        label: '电话',
        detail: '137****4578',
      },
    ]);
    expect(getJsonStringSemanticHints('400-805-8686', { path: '$.contactTel', keyLabel: 'contactTel' })).toEqual([
      {
        kind: 'phone',
        label: '电话',
        detail: '400-805-8686',
      },
    ]);
    expect(getJsonStringSemanticHints('010-88886666', { path: '$.电话', keyLabel: '电话' })).toEqual([
      {
        kind: 'phone',
        label: '电话',
        detail: '010****6666',
      },
    ]);
  });

  it('忽略非字符串、空字符串和非法日期', () => {
    expect(getJsonStringSemanticHints(123)).toEqual([]);
    expect(getJsonStringSemanticHints('   ')).toEqual([]);
    expect(getJsonStringSemanticHints('2026-02-31')).toEqual([]);
    expect(getJsonStringSemanticHints('hello')).toEqual([]);
    expect(getJsonStringSemanticHints('1.2.3')).toEqual([]);
    expect(getJsonStringSemanticHints('13718164578')).toEqual([]);
    expect(getJsonStringSemanticHints('13718164578', { path: '$.traceId', keyLabel: 'traceId' })).toEqual([]);
    expect(getJsonStringSemanticHints('20260619123', { path: '$.phone', keyLabel: 'phone' })).toEqual([]);
  });
});
