import { describe, expect, it, vi } from 'vitest';
import { AppPaneResizeHandle, AppSidebarResizeHandle } from './AppResizeHandles';

interface ElementLike {
  props: Record<string, unknown>;
}

const isElementLike = (node: unknown): node is ElementLike => (
  typeof node === 'object' &&
  node !== null &&
  'props' in node &&
  typeof (node as ElementLike).props === 'object' &&
  (node as ElementLike).props !== null
);

describe('AppResizeHandles', () => {
  it('侧栏隐藏时不渲染 resize handle', () => {
    expect(AppSidebarResizeHandle({
      isVisible: false,
      isResizing: false,
      sidebarWidth: 320,
      minWidth: 240,
      maxWidth: 480,
      onMouseDown: vi.fn(),
      onKeyDown: vi.fn(),
    })).toBeNull();
  });

  it('侧栏 resize handle 透传宽度 ARIA 和定位样式', () => {
    const onMouseDown = vi.fn();
    const onKeyDown = vi.fn();
    const tree = AppSidebarResizeHandle({
      isVisible: true,
      isResizing: true,
      sidebarWidth: 321.6,
      minWidth: 240,
      maxWidth: 480,
      onMouseDown,
      onKeyDown,
    });

    expect(isElementLike(tree)).toBe(true);
    if (!isElementLike(tree)) throw new Error('侧栏 resize handle 应返回 React 元素');
    expect(tree.props.tourId).toBe('sidebar-resize-handle');
    expect(tree.props.valueNow).toBe(322);
    expect(tree.props.valueText).toBe('工具栏宽度 322 像素');
    expect(tree.props.style).toEqual({ left: 319.6 });
    expect(tree.props.className).toContain('bg-brand-primary');
    expect(tree.props.onMouseDown).toBe(onMouseDown);
    expect(tree.props.onKeyDown).toBe(onKeyDown);
  });

  it('分栏 resize handle 透传百分比 ARIA 和空闲样式', () => {
    const tree = AppPaneResizeHandle({
      isResizing: false,
      leftPaneWidthPercent: 42.3,
      minPercent: 25,
      maxPercent: 75,
      onMouseDown: vi.fn(),
      onKeyDown: vi.fn(),
    });

    expect(isElementLike(tree)).toBe(true);
    if (!isElementLike(tree)) throw new Error('分栏 resize handle 应返回 React 元素');
    expect(tree.props.tourId).toBe('editor-pane-resize-handle');
    expect(tree.props.valueMin).toBe(25);
    expect(tree.props.valueMax).toBe(75);
    expect(tree.props.valueNow).toBe(42);
    expect(tree.props.valueText).toBe('SOURCE 宽度 42%');
    expect(tree.props.className).toContain('bg-editor-sidebar');
  });
});
