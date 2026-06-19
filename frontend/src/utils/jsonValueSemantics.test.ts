import { describe, expect, it } from 'vitest';
import { getJsonStringSemanticHints } from './jsonValueSemantics';
import { base64Encode } from './schemeUtils';

const encodeBase64Url = (value: string): string => (
  base64Encode(value).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
);

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

  it('识别常见静态资源 URL 类型', () => {
    expect(getJsonStringSemanticHints('https://static.example.com/banner.jpg', { path: '$.poster_image', keyLabel: 'poster_image' })).toEqual([
      {
        kind: 'url',
        label: 'URL',
        detail: 'static.example.com/banner.jpg',
      },
      {
        kind: 'resource-image',
        label: '图片资源',
        detail: 'banner.jpg',
      },
    ]);
    expect(getJsonStringSemanticHints('https://static.example.com/ad.mp4', { path: '$.video_url', keyLabel: 'video_url' })).toEqual(expect.arrayContaining([
      {
        kind: 'resource-video',
        label: '视频资源',
        detail: 'ad.mp4',
      },
    ]));
    expect(getJsonStringSemanticHints('https://static.example.com/swipe.zip', { path: '$.swipe_up_lottie', keyLabel: 'swipe_up_lottie' })).toEqual(expect.arrayContaining([
      {
        kind: 'resource-lottie',
        label: 'Lottie',
        detail: 'swipe.zip',
      },
    ]));
    expect(getJsonStringSemanticHints('https://static.example.com/voice.mp3', { path: '$.audio_url', keyLabel: 'audio_url' })).toEqual(expect.arrayContaining([
      {
        kind: 'resource-audio',
        label: '音频资源',
        detail: 'voice.mp3',
      },
    ]));
    expect(getJsonStringSemanticHints('https://static.example.com/app.apk', { path: '$.download_url', keyLabel: 'download_url' })).toEqual(expect.arrayContaining([
      {
        kind: 'resource-package',
        label: '包资源',
        detail: 'app.apk',
      },
    ]));
    expect(getJsonStringSemanticHints('https://static.example.com/anim.lottie')).toEqual(expect.arrayContaining([
      {
        kind: 'resource-lottie',
        label: 'Lottie',
        detail: 'anim.lottie',
      },
    ]));
  });

  it('识别 JWT 和 Base64 结构化内容但不展示解码明文', () => {
    const jwt = [
      encodeBase64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' })),
      encodeBase64Url(JSON.stringify({ sub: 'u-1', exp: 1893456000, role: 'admin' })),
      'fake-signature',
    ].join('.');

    expect(getJsonStringSemanticHints(jwt)).toEqual([
      {
        kind: 'jwt',
        label: 'JWT',
        detail: 'payload: sub, exp, role · header: alg, typ',
      },
    ]);
    expect(getJsonStringSemanticHints(base64Encode(JSON.stringify({ scene: 'demo', enabled: true })))).toEqual([
      {
        kind: 'base64',
        label: 'Base64',
        detail: 'JSON: scene, enabled',
      },
    ]);
    expect(getJsonStringSemanticHints(encodeBase64Url(JSON.stringify({ a: 1 })))).toEqual([
      {
        kind: 'base64',
        label: 'Base64',
        detail: 'JSON: a',
      },
    ]);
    expect(getJsonStringSemanticHints(base64Encode('plain readable text longer than twenty chars'))).toEqual([
      {
        kind: 'base64',
        label: 'Base64',
        detail: '文本 44 字符',
      },
    ]);
  });

  it('忽略非字符串、空字符串和非法日期', () => {
    expect(getJsonStringSemanticHints(123)).toEqual([]);
    expect(getJsonStringSemanticHints('   ')).toEqual([]);
    expect(getJsonStringSemanticHints('2026-02-31')).toEqual([]);
    expect(getJsonStringSemanticHints('hello')).toEqual([]);
    expect(getJsonStringSemanticHints('1.2.3')).toEqual([]);
    expect(getJsonStringSemanticHints('foo.bar.baz')).toEqual([]);
    expect(getJsonStringSemanticHints('not.a.jwt.token')).toEqual([]);
    expect(getJsonStringSemanticHints(base64Encode('hello'))).toEqual([]);
    expect(getJsonStringSemanticHints('13718164578')).toEqual([]);
    expect(getJsonStringSemanticHints('13718164578', { path: '$.traceId', keyLabel: 'traceId' })).toEqual([]);
    expect(getJsonStringSemanticHints('20260619123', { path: '$.phone', keyLabel: 'phone' })).toEqual([]);
    expect(getJsonStringSemanticHints('https://example.com/docs')).toEqual([
      {
        kind: 'url',
        label: 'URL',
        detail: 'example.com/docs',
      },
    ]);
    expect(getJsonStringSemanticHints('https://example.com/page', { path: '$.download_url', keyLabel: 'download_url' })).toEqual([
      {
        kind: 'url',
        label: 'URL',
        detail: 'example.com/page',
      },
    ]);
    expect(getJsonStringSemanticHints('https://example.com/api?id=1', { path: '$.imageUrl', keyLabel: 'imageUrl' })).toEqual([
      {
        kind: 'url',
        label: 'URL',
        detail: 'example.com/api',
      },
    ]);
  });
});
