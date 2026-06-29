import { describe, expect, it } from 'vitest';
import {
  formatDecodedPathCopyValue,
  formatJsonValuePreview,
  formatOriginalPreview,
} from './transformValuePreview';

describe('transformValuePreview', () => {
  it('格式化原始字符串预览', () => {
    expect(formatOriginalPreview('abcdef', 10)).toBe('abcdef');
    expect(formatOriginalPreview('abcdef', 3)).toBe('abc...');
  });

  it('格式化 JSON 值预览', () => {
    expect(formatJsonValuePreview([1, 2, 3])).toBe('数组 3 项');
    expect(formatJsonValuePreview({})).toBe('对象: 空');
    expect(formatJsonValuePreview({
      a: 1,
      b: 2,
      c: 3,
      d: 4,
      e: 5,
      f: 6,
      g: 7,
      h: 8,
      i: 9,
    })).toBe('对象: a, b, c, d, e, f, g, h ... +1');
    expect(formatJsonValuePreview('abcdef', 3)).toBe('abc...');
    expect(formatJsonValuePreview(true)).toBe('true');
  });

  it('格式化内部路径复制值', () => {
    expect(formatDecodedPathCopyValue('abc')).toBe('"abc"');
    expect(formatDecodedPathCopyValue({ a: 1 })).toBe('{"a":1}');
    expect(formatDecodedPathCopyValue('abcdef', 5)).toBe('"abcd...');
  });
});
