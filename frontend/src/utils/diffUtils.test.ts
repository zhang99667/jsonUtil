import { describe, expect, it } from 'vitest';
import { computeLineDiff, DIRTY_DIFF_MAX_TOTAL_LENGTH, shouldSkipLineDiff } from './diffUtils';

describe('computeLineDiff', () => {
  it('识别单行修改', () => {
    expect(computeLineDiff('{"a":1}\n', '{"a":2}\n')).toEqual([
      { type: 'modify', startLine: 1, endLine: 1 },
    ]);
  });

  it('识别新增行', () => {
    expect(computeLineDiff('{"a":1}\n', '{"a":1}\n{"b":2}\n')).toEqual([
      { type: 'add', startLine: 2, endLine: 2 },
    ]);
  });

  it('删除无末尾换行的最后一行时锚定到剩余行', () => {
    expect(computeLineDiff('第一行\n第二行', '第一行')).toEqual([
      { type: 'delete', startLine: 1, endLine: 1 },
    ]);
  });

  it('删除带末尾换行的最后一行时锚定到空白末行', () => {
    expect(computeLineDiff('第一行\n第二行\n', '第一行\n')).toEqual([
      { type: 'delete', startLine: 2, endLine: 2 },
    ]);
  });

  it('仅换行符风格不同时不标记内容差异', () => {
    expect(computeLineDiff('第一行\r\n第二行\r\n', '第一行\n第二行\n')).toEqual([]);
  });
});

describe('shouldSkipLineDiff', () => {
  it('未超过阈值时允许计算行级 Diff', () => {
    const halfLimit = DIRTY_DIFF_MAX_TOTAL_LENGTH / 2;

    expect(shouldSkipLineDiff('a'.repeat(halfLimit), 'b'.repeat(halfLimit))).toBe(false);
  });

  it('超过阈值时跳过行级 Diff', () => {
    expect(shouldSkipLineDiff('a'.repeat(DIRTY_DIFF_MAX_TOTAL_LENGTH), 'b')).toBe(true);
  });
});
