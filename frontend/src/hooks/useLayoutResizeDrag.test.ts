import { beforeEach, describe, expect, it, vi } from 'vitest';
import { updateLayoutResizeDrag } from './layoutResizeDragUpdate';
import { useLayoutResizeDrag } from './useLayoutResizeDrag';
import { useWindowMouseDragListeners } from './useWindowMouseDragListeners';

const reactMocks = vi.hoisted(() => ({ useCallback: vi.fn() }));

vi.mock('react', async importOriginal => ({
  ...await importOriginal<typeof import('react')>(),
  useCallback: reactMocks.useCallback,
}));

vi.mock('./layoutResizeDragUpdate', () => ({
  updateLayoutResizeDrag: vi.fn(),
}));

vi.mock('./useWindowMouseDragListeners', async importOriginal => ({
  ...await importOriginal<typeof import('./useWindowMouseDragListeners')>(),
  useWindowMouseDragListeners: vi.fn(),
}));

const appRef = { current: null };

const createInput = (overrides = {}) => ({
  appRef,
  sidebarWidth: 220,
  isResizingSidebar: false,
  isResizingPane: false,
  setSidebarWidth: vi.fn(),
  setLeftPaneWidthPercent: vi.fn(),
  setIsResizingSidebar: vi.fn(),
  setIsResizingPane: vi.fn(),
  ...overrides,
});

const getListeners = () => vi.mocked(useWindowMouseDragListeners).mock.calls.at(-1)?.[0];

describe('useLayoutResizeDrag', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    reactMocks.useCallback.mockImplementation((callback: unknown) => callback);
  });

  it('返回开始拖拽 handler 并挂载非激活监听状态', () => {
    const input = createInput();
    const result = useLayoutResizeDrag(input);
    result.startResizingSidebar();
    result.startResizingPane();

    expect(input.setIsResizingSidebar).toHaveBeenCalledWith(true);
    expect(input.setIsResizingPane).toHaveBeenCalledWith(true);
    expect(getListeners()?.isActive).toBe(false);
  });

  it('鼠标松开时同时停止侧栏和分栏拖拽', () => {
    const input = createInput({ isResizingSidebar: true });
    useLayoutResizeDrag(input);
    getListeners()?.onMouseUp();

    expect(getListeners()?.isActive).toBe(true);
    expect(input.setIsResizingSidebar).toHaveBeenCalledWith(false);
    expect(input.setIsResizingPane).toHaveBeenCalledWith(false);
  });

  it('鼠标移动时委托拖拽更新 helper', () => {
    const input = createInput({ isResizingPane: true });
    useLayoutResizeDrag(input);
    getListeners()?.onMouseMove({ clientX: 620 } as MouseEvent);

    expect(updateLayoutResizeDrag).toHaveBeenCalledWith(expect.objectContaining({
      clientX: 620,
      appElement: appRef.current,
      sidebarWidth: input.sidebarWidth,
      isResizingPane: true,
    }));
  });
});
