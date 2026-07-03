import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAppLayoutController } from './useAppLayoutController';
import { useLayout } from './useLayout';

const reactMocks = vi.hoisted(() => ({
  useCallback: vi.fn(),
}));

vi.mock('react', async importOriginal => ({
  ...await importOriginal<typeof import('react')>(),
  useCallback: reactMocks.useCallback,
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

const createKeyboardEvent = (key: string, shiftKey = false) => ({
  key,
  shiftKey,
  preventDefault: vi.fn(),
});

describe('useAppLayoutController', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    reactMocks.useCallback.mockImplementation((callback: unknown) => callback);
    vi.mocked(useLayout).mockReturnValue(layout);
  });

  it('透传 useLayout 状态并提供键盘调整 handler', () => {
    const result = useAppLayoutController({ current: null });

    expect(result.sidebarWidth).toBe(220);
    expect(result.leftPaneWidthPercent).toBe(50);
    expect(result.startResizingSidebar).toBe(layout.startResizingSidebar);
    expect(typeof result.handleSidebarResizeKeyDown).toBe('function');
    expect(typeof result.handlePaneResizeKeyDown).toBe('function');
  });

  it('侧栏支持键盘调整宽度并阻止默认行为', () => {
    const result = useAppLayoutController({ current: null });
    const event = createKeyboardEvent('ArrowRight');

    result.handleSidebarResizeKeyDown(event as never);

    expect(event.preventDefault).toHaveBeenCalledTimes(1);
    expect(layout.setSidebarWidth).toHaveBeenCalledWith(236);
  });

  it('分栏支持 Shift 键加速调整并阻止默认行为', () => {
    const result = useAppLayoutController({ current: null });
    const event = createKeyboardEvent('ArrowLeft', true);

    result.handlePaneResizeKeyDown(event as never);

    expect(event.preventDefault).toHaveBeenCalledTimes(1);
    expect(layout.setLeftPaneWidthPercent).toHaveBeenCalledWith(40);
  });

  it('无关按键不触发布局更新', () => {
    const result = useAppLayoutController({ current: null });
    const event = createKeyboardEvent('Tab');

    result.handleSidebarResizeKeyDown(event as never);
    result.handlePaneResizeKeyDown(event as never);

    expect(event.preventDefault).not.toHaveBeenCalled();
    expect(layout.setSidebarWidth).not.toHaveBeenCalled();
    expect(layout.setLeftPaneWidthPercent).not.toHaveBeenCalled();
  });
});
