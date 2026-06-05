import { describe, expect, it } from 'vitest';
import { getDocumentStats } from './documentStats';

describe('getDocumentStats', () => {
  it('空内容按单行统计', () => {
    expect(getDocumentStats('')).toEqual({ totalLines: 1, maxColumns: 0 });
  });

  it('统计多行内容和最大列数', () => {
    expect(getDocumentStats('a\nabcd\nxy')).toEqual({ totalLines: 3, maxColumns: 4 });
  });

  it('保留末尾空行统计', () => {
    expect(getDocumentStats('abc\n')).toEqual({ totalLines: 2, maxColumns: 3 });
  });

  it('大内容不依赖数组展开或 split', () => {
    const longLine = 'x'.repeat(100_000);
    expect(getDocumentStats(`${longLine}\ny`)).toEqual({
      totalLines: 2,
      maxColumns: 100_000,
    });
  });
});
