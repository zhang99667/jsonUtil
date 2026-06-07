import { describe, expect, it } from 'vitest';
import { getDocumentStats } from './documentStats';

describe('getDocumentStats', () => {
  it('空内容按单行统计', () => {
    expect(getDocumentStats('')).toEqual({ totalLines: 1, maxColumns: 0, isLimited: false });
  });

  it('统计多行内容和最大列数', () => {
    expect(getDocumentStats('a\nabcd\nxy')).toEqual({ totalLines: 3, maxColumns: 4, isLimited: false });
  });

  it('保留末尾空行统计', () => {
    expect(getDocumentStats('abc\n')).toEqual({ totalLines: 2, maxColumns: 3, isLimited: false });
  });

  it('大内容不依赖数组展开或 split', () => {
    const longLine = 'x'.repeat(100_000);
    expect(getDocumentStats(`${longLine}\ny`)).toEqual({
      totalLines: 2,
      maxColumns: 100_000,
      isLimited: false,
    });
  });

  it('超过扫描上限时返回采样统计', () => {
    expect(getDocumentStats('abcd\nefgh\nijkl', { maxScanLength: 6 })).toEqual({
      totalLines: 2,
      maxColumns: 4,
      isLimited: true,
    });
  });
});
