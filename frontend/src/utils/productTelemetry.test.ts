import { describe, expect, it } from 'vitest';
import {
  buildToolEventPayload,
  getDurationBucket,
  getTextSizeBucket,
  shouldEnableToolEventTelemetry,
} from './productTelemetry';

describe('productTelemetry', () => {
  it('按文本字节数生成输入大小分桶', () => {
    expect(getTextSizeBucket('')).toBe('empty');
    expect(getTextSizeBucket('abc')).toBe('lt_10kb');
    expect(getTextSizeBucket('中'.repeat(4 * 1024))).toBe('10_50kb');
    expect(getTextSizeBucket('x'.repeat(60 * 1024))).toBe('50_250kb');
    expect(getTextSizeBucket('x'.repeat(300 * 1024))).toBe('250kb_1mb');
    expect(getTextSizeBucket('x'.repeat(1024 * 1024))).toBe('gt_1mb');
  });

  it('按耗时生成稳定分桶', () => {
    expect(getDurationBucket(-1)).toBe('unknown');
    expect(getDurationBucket(0)).toBe('instant');
    expect(getDurationBucket(99)).toBe('lt_100ms');
    expect(getDurationBucket(499)).toBe('100_500ms');
    expect(getDurationBucket(1_999)).toBe('500ms_2s');
    expect(getDurationBucket(9_999)).toBe('2_10s');
    expect(getDurationBucket(10_000)).toBe('gt_10s');
  });

  it('构造事件 payload 时补齐默认值', () => {
    expect(buildToolEventPayload({
      eventName: 'AI_FIX',
      category: 'ai',
    })).toEqual({
      eventName: 'AI_FIX',
      category: 'ai',
      status: 'success',
      inputSizeBucket: 'unknown',
      durationBucket: 'unknown',
      source: 'web',
    });
  });

  it('测试环境默认不发送工具事件', () => {
    expect(shouldEnableToolEventTelemetry()).toBe(false);
  });
});
