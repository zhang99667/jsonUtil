import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useCustomScrollbar } from './useCustomScrollbar';

const reactMocks = vi.hoisted(() => ({
  setMetrics: vi.fn(),
  setIsDragging: vi.fn(),
  useCallback: vi.fn(),
  useEffect: vi.fn(),
  useRef: vi.fn(),
  useState: vi.fn(),
}));

const listenerMocks = vi.hoisted(() => ({
  useWindowMouseDragListeners: vi.fn(),
}));

vi.mock('react', async importOriginal => ({
  ...await importOriginal<typeof import('react')>(),
  useCallback: reactMocks.useCallback,
  useEffect: reactMocks.useEffect,
  useRef: reactMocks.useRef,
  useState: reactMocks.useState,
}));

vi.mock('./useWindowMouseDragListeners', () => ({
  useWindowMouseDragListeners: listenerMocks.useWindowMouseDragListeners,
}));

describe('useCustomScrollbar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    reactMocks.useCallback.mockImplementation((callback: unknown) => callback);
    reactMocks.useEffect.mockImplementation((effect: () => void | (() => void)) => effect());
    reactMocks.useState.mockImplementation((initialValue: unknown) => (
      initialValue === false
        ? [false, reactMocks.setIsDragging]
        : [initialValue, reactMocks.setMetrics]
    ));
    vi.stubGlobal('ResizeObserver', vi.fn(function ResizeObserver() {
      return {
        observe: vi.fn(),
        disconnect: vi.fn(),
      };
    }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('挂载后立即读取当前滚动尺寸', () => {
    reactMocks.useRef.mockReturnValue({
      current: {
        scrollTop: 12,
        scrollHeight: 100,
        clientHeight: 20,
        children: [],
      },
    });

    useCustomScrollbar('vertical', 'content-key');

    expect(reactMocks.setMetrics).toHaveBeenCalledWith({
      scrollPos: 12,
      scrollSize: 100,
      clientSize: 20,
    });
  });
});
