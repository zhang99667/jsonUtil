import { describe, expect, it } from 'vitest';
import {
  adjustJsonCompareEditorPercentByKey,
  clampJsonCompareEditorPercent,
  getJsonCompareEditorPercentFromPointer,
  JSON_COMPARE_EDITOR_MAX_PERCENT,
  JSON_COMPARE_EDITOR_MIN_PERCENT,
} from './jsonCompareLayout';

describe('jsonCompareLayout', () => {
  it('将拖动位置换算到编辑区允许范围', () => {
    expect(getJsonCompareEditorPercentFromPointer(400, 100, 500)).toBe(60);
    expect(getJsonCompareEditorPercentFromPointer(-100, 100, 500)).toBe(JSON_COMPARE_EDITOR_MIN_PERCENT);
    expect(getJsonCompareEditorPercentFromPointer(900, 100, 500)).toBe(JSON_COMPARE_EDITOR_MAX_PERCENT);
    expect(getJsonCompareEditorPercentFromPointer(400, 100, 0)).toBe(58);
  });

  it('支持方向键和首尾键调整编辑区高度', () => {
    expect(adjustJsonCompareEditorPercentByKey(58, 'ArrowUp')).toBe(54);
    expect(adjustJsonCompareEditorPercentByKey(58, 'ArrowDown')).toBe(62);
    expect(adjustJsonCompareEditorPercentByKey(58, 'Home')).toBe(JSON_COMPARE_EDITOR_MIN_PERCENT);
    expect(adjustJsonCompareEditorPercentByKey(58, 'End')).toBe(JSON_COMPARE_EDITOR_MAX_PERCENT);
    expect(adjustJsonCompareEditorPercentByKey(58, 'Enter')).toBeNull();
  });

  it('键盘连续调整不会越界', () => {
    expect(clampJsonCompareEditorPercent(-1)).toBe(JSON_COMPARE_EDITOR_MIN_PERCENT);
    expect(clampJsonCompareEditorPercent(101)).toBe(JSON_COMPARE_EDITOR_MAX_PERCENT);
  });
});
