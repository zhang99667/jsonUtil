import { describe, expect, it, vi } from 'vitest';
import { updateLayoutResizeDrag } from './layoutResizeDragUpdate';

const appElement = {
  getBoundingClientRect: () => ({ left: 10, width: 1010 }),
};

describe('layoutResizeDragUpdate', () => {
  it('拖拽侧栏时按鼠标位置更新侧栏宽度', () => {
    const setSidebarWidth = vi.fn();
    const setLeftPaneWidthPercent = vi.fn();

    updateLayoutResizeDrag({
      clientX: 260,
      appElement,
      sidebarWidth: 220,
      isResizingSidebar: true,
      isResizingPane: false,
      setSidebarWidth,
      setLeftPaneWidthPercent,
    });

    expect(setSidebarWidth).toHaveBeenCalledWith(260);
    expect(setLeftPaneWidthPercent).not.toHaveBeenCalled();
  });

  it('拖拽分栏时按编辑区相对位置更新左右比例', () => {
    const setSidebarWidth = vi.fn();
    const setLeftPaneWidthPercent = vi.fn();

    updateLayoutResizeDrag({
      clientX: 620,
      appElement,
      sidebarWidth: 210,
      isResizingSidebar: false,
      isResizingPane: true,
      setSidebarWidth,
      setLeftPaneWidthPercent,
    });

    expect(setLeftPaneWidthPercent).toHaveBeenCalledWith(50);
    expect(setSidebarWidth).not.toHaveBeenCalled();
  });

  it('分栏拖拽缺少容器时不更新比例', () => {
    const setLeftPaneWidthPercent = vi.fn();

    updateLayoutResizeDrag({
      clientX: 620,
      appElement: null,
      sidebarWidth: 210,
      isResizingSidebar: false,
      isResizingPane: true,
      setSidebarWidth: vi.fn(),
      setLeftPaneWidthPercent,
    });

    expect(setLeftPaneWidthPercent).not.toHaveBeenCalled();
  });
});
