import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useActionPanelScrollbar } from './useActionPanelScrollbar';

const reactMocks = vi.hoisted(() => ({
  useCallback: vi.fn(),
}));

const scrollbarMocks = vi.hoisted(() => ({
  containerRef: { current: null },
  handleCustomScroll: vi.fn(),
  handleMouseDown: vi.fn(),
  scheduleScrollFrame: vi.fn(),
  useCustomScrollbar: vi.fn(),
  useRafCallback: vi.fn(),
}));

vi.mock('react', async importOriginal => ({
  ...await importOriginal<typeof import('react')>(),
  useCallback: reactMocks.useCallback,
}));

vi.mock('./useCustomScrollbar', () => ({
  useCustomScrollbar: scrollbarMocks.useCustomScrollbar,
}));

vi.mock('./useRafCallback', () => ({
  useRafCallback: scrollbarMocks.useRafCallback,
}));

describe('useActionPanelScrollbar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    reactMocks.useCallback.mockImplementation((callback: unknown) => callback);
    scrollbarMocks.useCustomScrollbar.mockReturnValue({
      scrollContainerRef: scrollbarMocks.containerRef,
      handleScroll: scrollbarMocks.handleCustomScroll,
      handleMouseDown: scrollbarMocks.handleMouseDown,
      thumbSize: 36,
      thumbOffset: 24,
      showScrollbar: true,
    });
    scrollbarMocks.useRafCallback.mockReturnValue(scrollbarMocks.scheduleScrollFrame);
  });

  it('复用垂直通用滚动条并保留 ActionPanel 视图状态命名', () => {
    const onScrollFrame = vi.fn();
    const result = useActionPanelScrollbar({ isCollapsed: true, onScrollFrame });

    expect(scrollbarMocks.useCustomScrollbar).toHaveBeenCalledWith('vertical', true);
    expect(scrollbarMocks.useRafCallback).toHaveBeenCalledWith(onScrollFrame);
    expect(result.containerRef).toBe(scrollbarMocks.containerRef);
    expect(result.handleScrollbarMouseDown).toBe(scrollbarMocks.handleMouseDown);
    expect(result.scrollbarViewState).toEqual({
      showScrollbar: true,
      thumbHeight: 36,
      thumbTop: 24,
    });
  });

  it('滚动时先调度引导刷新帧再更新通用滚动条状态', () => {
    const result = useActionPanelScrollbar({ isCollapsed: false, onScrollFrame: vi.fn() });

    result.handleScroll();

    expect(scrollbarMocks.scheduleScrollFrame).toHaveBeenCalledTimes(1);
    expect(scrollbarMocks.handleCustomScroll).toHaveBeenCalledTimes(1);
    expect(scrollbarMocks.scheduleScrollFrame.mock.invocationCallOrder[0]).toBeLessThan(
      scrollbarMocks.handleCustomScroll.mock.invocationCallOrder[0]
    );
  });
});
