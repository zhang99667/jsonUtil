import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useLayoutResizeDrag } from './useLayoutResizeDrag';
import { useWindowMouseDragListeners } from './useWindowMouseDragListeners';

const reactMocks = vi.hoisted(() => ({ useCallback: vi.fn() }));

vi.mock('react', async importOriginal => ({
  ...await importOriginal<typeof import('react')>(),
  useCallback: reactMocks.useCallback,
}));

vi.mock('./useWindowMouseDragListeners', async importOriginal => ({
  ...await importOriginal<typeof import('./useWindowMouseDragListeners')>(),
  useWindowMouseDragListeners: vi.fn(),
}));

const createInput = (overrides = {}) => ({
  appRef: { current: null },
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
const moveMouse = (clientX: number) => getListeners()?.onMouseMove({ clientX } as MouseEvent);
const appRefWithRect = { current: { getBoundingClientRect: () => ({ left: 10, width: 1010 }) } };

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

  it('拖拽侧栏时按鼠标位置更新侧栏宽度', () => {
    const input = createInput({ isResizingSidebar: true });
    useLayoutResizeDrag(input);
    moveMouse(260);

    expect(input.setSidebarWidth).toHaveBeenCalledWith(260);
    expect(input.setLeftPaneWidthPercent).not.toHaveBeenCalled();
  });

  it('拖拽分栏时按编辑区相对位置更新左右比例', () => {
    const input = createInput({
      isResizingPane: true,
      sidebarWidth: 210,
      appRef: appRefWithRect,
    });
    useLayoutResizeDrag(input);
    moveMouse(620);

    expect(input.setLeftPaneWidthPercent).toHaveBeenCalledWith(50);
    expect(input.setSidebarWidth).not.toHaveBeenCalled();

    const missingRefInput = createInput({ isResizingPane: true });
    useLayoutResizeDrag(missingRefInput);
    moveMouse(620);

    expect(missingRefInput.setLeftPaneWidthPercent).not.toHaveBeenCalled();
  });
});
