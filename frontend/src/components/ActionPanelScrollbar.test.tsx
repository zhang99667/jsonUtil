import { describe, expect, it, vi } from 'vitest';
import { ActionPanelScrollbar } from './ActionPanelScrollbar';

interface ElementLike {
  type?: unknown;
  props: Record<string, unknown>;
}

const isElementLike = (node: unknown): node is ElementLike => (
  typeof node === 'object' &&
  node !== null &&
  'props' in node &&
  typeof (node as ElementLike).props === 'object' &&
  (node as ElementLike).props !== null
);

describe('ActionPanelScrollbar', () => {
  it('隐藏时不渲染滚动条壳', () => {
    expect(ActionPanelScrollbar({
      showScrollbar: false,
      thumbHeight: 20,
      thumbTop: 10,
      onMouseDown: vi.fn(),
    })).toBeNull();
  });

  it('展示时透传 thumb 百分比和拖拽回调', () => {
    const onMouseDown = vi.fn();
    const tree = ActionPanelScrollbar({
      showScrollbar: true,
      thumbHeight: 36,
      thumbTop: 24,
      onMouseDown,
    });

    expect(isElementLike(tree)).toBe(true);
    if (!isElementLike(tree)) throw new Error('ActionPanelScrollbar 应返回 React 元素');
    const thumb = tree.props.children;
    expect(isElementLike(thumb)).toBe(true);
    if (!isElementLike(thumb)) throw new Error('滚动条 thumb 应返回 React 元素');
    expect(thumb.props.style).toEqual({ height: '36%', top: '24%' });
    expect(thumb.props.onMouseDown).toBe(onMouseDown);
  });
});
