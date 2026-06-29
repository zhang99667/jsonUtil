import { describe, expect, it } from 'vitest';
import {
  getResourceTypeLabel,
  getResourceTypeQuery,
  getResourceTypeSearchTokens,
  getStaticResourceType,
  isStaticResourceSchema,
} from './staticResourceSchema';

describe('staticResourceSchema', () => {
  it('按 URL 后缀和字段路径识别静态资源类型', () => {
    expect(getStaticResourceType('https://static.example.com/ad.mp4?pd=1', '$.video_url')).toBe('video');
    expect(getStaticResourceType('https://static.example.com/banner.jpg?w=100', '$.imageUrl')).toBe('image');
    expect(getStaticResourceType('https://static.example.com/swipe.zip', '$.swipe_up_lottie')).toBe('lottie');
    expect(getStaticResourceType('https://static.example.com/voice.m4a', '$.audio_url')).toBe('audio');
    expect(getStaticResourceType('https://static.example.com/app.apk', '$.download_url')).toBe('package');
    expect(getStaticResourceType('https://static.example.com/file.bin', '$.download_url')).toBe('other');
  });

  it('识别资源 URL 时保留普通落地页 HTTPS URL 的边界', () => {
    expect(isStaticResourceSchema('https://static.example.com/ad.mp4?pd=1', '$.video_url')).toBe(true);
    expect(isStaticResourceSchema('https://static.example.com/assets/open.png', '$.button_icon')).toBe(true);
    expect(isStaticResourceSchema('https://example.com/landing?sku=101', '$.page_url')).toBe(false);
    expect(isStaticResourceSchema('open.png?x=1', '$.button_icon')).toBe(true);
  });

  it('提供资源类型展示文案、查询词和搜索 token', () => {
    expect(getResourceTypeLabel('image')).toBe('图片');
    expect(getResourceTypeQuery('video')).toBe('资源类型:视频');
    expect(getResourceTypeSearchTokens('lottie')).toEqual([
      'lottie',
      'lottie',
      '资源类型:lottie',
      'resource:lottie',
    ]);
  });
});
