import { describe, expect, it } from 'vitest';
import {
  getCustomScrollbarDragScrollPos,
  getCustomScrollbarThumbMetrics,
} from './customScrollbar';

describe('customScrollbar', () => {
  it('不可滚动或尺寸缺失时返回稳定空状态', () => {
    expect(getCustomScrollbarThumbMetrics({
      scrollPos: 0,
      scrollSize: 0,
      clientSize: 0,
    })).toEqual({ thumbSize: 0, thumbOffset: 0, showScrollbar: false });
    expect(getCustomScrollbarThumbMetrics({
      scrollPos: 0,
      scrollSize: 100,
      clientSize: 100,
    })).toEqual({ thumbSize: 0, thumbOffset: 0, showScrollbar: false });
  });

  it('可滚动时计算 thumb 尺寸和偏移，并限制在轨道内', () => {
    expect(getCustomScrollbarThumbMetrics({
      scrollPos: 50,
      scrollSize: 200,
      clientSize: 100,
    })).toEqual({ thumbSize: 50, thumbOffset: 25, showScrollbar: true });
    expect(getCustomScrollbarThumbMetrics({
      scrollPos: 400,
      scrollSize: 200,
      clientSize: 100,
    }).thumbOffset).toBe(50);
  });

  it('拖拽计算在容器尺寸缺失时保持起点', () => {
    expect(getCustomScrollbarDragScrollPos({
      startScrollPos: 20,
      delta: 10,
      scrollSize: 100,
      clientSize: 0,
    })).toBe(20);
    expect(getCustomScrollbarDragScrollPos({
      startScrollPos: 20,
      delta: 10,
      scrollSize: 200,
      clientSize: 100,
    })).toBe(40);
  });
});
