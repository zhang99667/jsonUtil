import { describe, expect, it } from 'vitest';
import { getDocumentStats } from './documentStats';

describe('getDocumentStats', () => {
  it('空内容按单行统计', () => {
    expect(getDocumentStats('')).toEqual({
      characterCount: 0,
      utf8ByteLength: 0,
      totalLines: 1,
      maxColumns: 0,
      isLimited: false,
    });
  });

  it('统计多行内容和最大列数', () => {
    expect(getDocumentStats('a\nabcd\nxy')).toEqual({
      characterCount: 9,
      utf8ByteLength: 9,
      totalLines: 3,
      maxColumns: 4,
      isLimited: false,
    });
  });

  it('保留末尾空行统计', () => {
    expect(getDocumentStats('abc\n')).toEqual({
      characterCount: 4,
      utf8ByteLength: 4,
      totalLines: 2,
      maxColumns: 3,
      isLimited: false,
    });
  });

  it('统计中文和 emoji 的 UTF-8 字节数', () => {
    expect(getDocumentStats('中🙂')).toEqual({
      characterCount: 3,
      utf8ByteLength: 7,
      totalLines: 1,
      maxColumns: 3,
      isLimited: false,
    });
  });

  it('大内容不依赖数组展开或 split', () => {
    const longLine = 'x'.repeat(100_000);
    expect(getDocumentStats(`${longLine}\ny`)).toEqual({
      characterCount: 100_002,
      utf8ByteLength: 100_002,
      totalLines: 2,
      maxColumns: 100_000,
      isLimited: false,
    });
  });

  it('超过扫描上限时返回采样统计', () => {
    expect(getDocumentStats('abcd\nefgh\nijkl', { maxScanLength: 6 })).toEqual({
      characterCount: 14,
      utf8ByteLength: 6,
      totalLines: 2,
      maxColumns: 4,
      isLimited: true,
    });
  });
});
