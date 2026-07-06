import { describe, expect, it, vi } from 'vitest';
import { AppPaneResizeHandle, AppSidebarResizeHandle } from './AppResizeHandles';
import { assertElementLike } from './componentElementTestHelpers';

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

    const handle = assertElementLike(tree, '侧栏 resize handle 应返回 React 元素');
    expect(handle.props.tourId).toBe('sidebar-resize-handle');
    expect(handle.props.valueNow).toBe(322);
    expect(handle.props.valueText).toBe('工具栏宽度 322 像素');
    expect(handle.props.style).toEqual({ left: 319.6 });
    expect(handle.props.className).toContain('bg-brand-primary');
    expect(handle.props.onMouseDown).toBe(onMouseDown);
    expect(handle.props.onKeyDown).toBe(onKeyDown);
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

    const handle = assertElementLike(tree, '分栏 resize handle 应返回 React 元素');
    expect(handle.props.tourId).toBe('editor-pane-resize-handle');
    expect(handle.props.valueMin).toBe(25);
    expect(handle.props.valueMax).toBe(75);
    expect(handle.props.valueNow).toBe(42);
    expect(handle.props.valueText).toBe('SOURCE 宽度 42%');
    expect(handle.props.className).toContain('bg-editor-sidebar');
  });
});
