import { describe, expect, it } from 'vitest';
import {
  formatJsonPathValueForCompactPreview,
  formatJsonPathValueForPreview,
} from './jsonPathPreview';

describe('formatJsonPathValueForPreview', () => {
  it('短字符串保持原样展示', () => {
    expect(formatJsonPathValueForPreview('Ada')).toBe('Ada');
  });

  it('小对象保留 JSON 明细，便于直接扫读查询结果', () => {
    const preview = formatJsonPathValueForPreview({
      level: 'info',
      user: { id: 1 },
    });

    expect(preview).toContain('"level": "info"');
    expect(preview).toContain('"id": 1');
  });

  it('小型 JSON Lines 根查询结果保留数组明细', () => {
    const preview = formatJsonPathValueForPreview([
      { level: 'info', user: { id: 1 } },
      { level: 'error', user: { id: 2 } },
    ]);

    expect(preview).toContain('"level": "info"');
    expect(preview).toContain('"level": "error"');
  });

  it('超长字符串只展示短预览', () => {
    const preview = formatJsonPathValueForPreview('x'.repeat(1000));

    expect(preview.length).toBeLessThanOrEqual(243);
    expect(preview.endsWith('...')).toBe(true);
  });

  it('大对象改为结构摘要，避免为根节点生成整段预览文本', () => {
    const preview = formatJsonPathValueForPreview({
      action_cmd: 'cmd='.concat('x'.repeat(2000)),
      ext: { id: 1 },
    });

    expect(preview).toContain('对象(2):');
    expect(preview).toContain('action_cmd:');
    expect(preview.length).toBeLessThan(260);
    expect(preview).not.toContain('x'.repeat(200));
  });

  it('大数组改为数量摘要', () => {
    const preview = formatJsonPathValueForPreview(Array.from({ length: 20 }, (_, index) => index));

    expect(preview).toContain('数组(20):');
    expect(preview).toContain('0, 1, 2');
  });

  it('紧凑预览中对象和数组只展示数量，避免结果列表展开结构', () => {
    expect(formatJsonPathValueForCompactPreview({
      auto_refresh_interval: '3000',
      auto_clear_cache_limit: '200',
    })).toBe('对象(2)');
    expect(formatJsonPathValueForCompactPreview([1, 2, 3])).toBe('数组(3)');
  });

  it('紧凑预览保留字符串和基础值的短文本', () => {
    expect(formatJsonPathValueForCompactPreview('x'.repeat(120))).toHaveLength(99);
    expect(formatJsonPathValueForCompactPreview(12)).toBe('12');
    expect(formatJsonPathValueForCompactPreview(null)).toBe('null');
  });
});
