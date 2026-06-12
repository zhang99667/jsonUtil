import { describe, expect, it } from 'vitest';
import {
  normalizeGoogleAnalyticsId,
  shouldEnableGoogleAnalytics,
} from './analytics';

describe('analytics', () => {
  it('会规范化 Google Analytics ID', () => {
    expect(normalizeGoogleAnalyticsId(' g-abc123 ')).toBe('G-ABC123');
  });

  it('默认不启用空值和占位统计 ID', () => {
    expect(shouldEnableGoogleAnalytics()).toBe(false);
    expect(shouldEnableGoogleAnalytics('')).toBe(false);
    expect(shouldEnableGoogleAnalytics('G-PLACEHOLDER')).toBe(false);
    expect(shouldEnableGoogleAnalytics('G-XXXXXXXXXX')).toBe(false);
  });

  it('只允许真实 GA4 measurement ID', () => {
    expect(shouldEnableGoogleAnalytics('G-ABC123XYZ9')).toBe(true);
    expect(shouldEnableGoogleAnalytics('UA-123456')).toBe(false);
    expect(shouldEnableGoogleAnalytics('not-ga')).toBe(false);
  });
});
