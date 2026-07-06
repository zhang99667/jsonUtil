import { beforeEach, describe, expect, it, vi } from 'vitest';
import { applyLayoutKeyboardResize } from './layoutKeyboardResize';
import { createLayoutKeyboardEvent } from './layoutKeyboardResizeTestHelper';
import { useAppLayoutController } from './useAppLayoutController';
import { useLayout } from './useLayout';

const reactMocks = vi.hoisted(() => ({ useCallback: vi.fn() }));

vi.mock('react', async importOriginal => ({
  ...await importOriginal<typeof import('react')>(),
  useCallback: reactMocks.useCallback,
}));

vi.mock('./layoutKeyboardResize', async importOriginal => ({
  ...await importOriginal<typeof import('./layoutKeyboardResize')>(),
  applyLayoutKeyboardResize: vi.fn(),
}));

vi.mock('./useLayout', async importOriginal => ({
  ...await importOriginal<typeof import('./useLayout')>(),
  useLayout: vi.fn(),
}));

const layout = {
  sidebarWidth: 220,
  setSidebarWidth: vi.fn(),
  isSidebarCollapsed: false,
  setIsSidebarCollapsed: vi.fn(),
  leftPaneWidthPercent: 50,
  setLeftPaneWidthPercent: vi.fn(),
  isResizingSidebar: false,
  isResizingPane: false,
  startResizingSidebar: vi.fn(),
  startResizingPane: vi.fn(),
};

describe('useAppLayoutController', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    reactMocks.useCallback.mockImplementation((callback: unknown) => callback);
    vi.mocked(useLayout).mockReturnValue(layout);
  });

  it('透传 useLayout 状态并提供键盘调整 handler', () => {
    const result = useAppLayoutController({ current: null });

    expect(result).toMatchObject({
      sidebarWidth: 220,
      leftPaneWidthPercent: 50,
      startResizingSidebar: layout.startResizingSidebar,
    });
    expect(typeof result.handleSidebarResizeKeyDown).toBe('function');
    expect(typeof result.handlePaneResizeKeyDown).toBe('function');
  });

  it('键盘调整委托给 resize helper', () => {
    const result = useAppLayoutController({ current: null });
    const sidebarEvent = createLayoutKeyboardEvent('ArrowRight');
    const paneEvent = createLayoutKeyboardEvent('ArrowLeft', true);

    result.handleSidebarResizeKeyDown(sidebarEvent as never);
    result.handlePaneResizeKeyDown(paneEvent as never);

    expect(applyLayoutKeyboardResize).toHaveBeenNthCalledWith(1, expect.objectContaining({
      event: sidebarEvent,
      currentValue: layout.sidebarWidth,
      onResize: layout.setSidebarWidth,
    }));
    expect(applyLayoutKeyboardResize).toHaveBeenNthCalledWith(2, expect.objectContaining({
      event: paneEvent,
      currentValue: layout.leftPaneWidthPercent,
      onResize: layout.setLeftPaneWidthPercent,
    }));
  });
});
