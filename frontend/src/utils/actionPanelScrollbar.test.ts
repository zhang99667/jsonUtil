import { describe, expect, it } from 'vitest';
import {
  getActionPanelDragScrollTop,
  getActionPanelScrollbarViewState,
} from './actionPanelScrollbar';

describe('actionPanelScrollbar', () => {
  it('按容器滚动比例计算自定义滚动条展示状态', () => {
    expect(getActionPanelScrollbarViewState({
      scrollTop: 250,
      scrollHeight: 1000,
      clientHeight: 250,
    })).toEqual({
      showScrollbar: true,
      thumbHeight: 25,
      thumbTop: 25,
    });
  });

  it('容器尺寸无效时返回空 thumb 状态', () => {
    expect(getActionPanelScrollbarViewState({
      scrollTop: 0,
      scrollHeight: 0,
      clientHeight: 250,
    })).toEqual({
      showScrollbar: false,
      thumbHeight: 0,
      thumbTop: 0,
    });

    expect(getActionPanelScrollbarViewState({
      scrollTop: 0,
      scrollHeight: 1000,
      clientHeight: 0,
    })).toEqual({
      showScrollbar: true,
      thumbHeight: 0,
      thumbTop: 0,
    });
  });

  it('按滚动内容比例计算拖拽后的 scrollTop', () => {
    expect(getActionPanelDragScrollTop({
      startScrollTop: 100,
      deltaY: 20,
      scrollHeight: 1000,
      clientHeight: 250,
    })).toBe(180);
  });

  it('拖拽容器高度无效时保留原 scrollTop', () => {
    expect(getActionPanelDragScrollTop({
      startScrollTop: 100,
      deltaY: 20,
      scrollHeight: 1000,
      clientHeight: 0,
    })).toBe(100);
  });
});
