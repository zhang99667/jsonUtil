import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useRafCallback } from './useRafCallback';

const reactMocks = vi.hoisted(() => ({
  useCallback: vi.fn(),
  useEffect: vi.fn(),
  useRef: vi.fn(),
}));

vi.mock('react', async importOriginal => ({
  ...await importOriginal<typeof import('react')>(),
  useCallback: reactMocks.useCallback,
  useEffect: reactMocks.useEffect,
  useRef: reactMocks.useRef,
}));

describe('useRafCallback', () => {
  let cleanup: (() => void) | undefined;
  let frameCallback: FrameRequestCallback | null;

  beforeEach(() => {
    vi.clearAllMocks();
    cleanup = undefined;
    frameCallback = null;
    reactMocks.useCallback.mockImplementation((callback: unknown) => callback);
    reactMocks.useEffect.mockImplementation((effect: () => void | (() => void)) => {
      cleanup = effect() || undefined;
    });
    reactMocks.useRef.mockImplementation((initialValue: unknown) => ({ current: initialValue }));
    vi.stubGlobal('requestAnimationFrame', vi.fn((callback: FrameRequestCallback) => {
      frameCallback = callback;
      return 7;
    }));
    vi.stubGlobal('cancelAnimationFrame', vi.fn());
  });

  it('同一帧内只调度一次回调', () => {
    const callback = vi.fn();
    const schedule = useRafCallback(callback);

    schedule();
    schedule();

    expect(requestAnimationFrame).toHaveBeenCalledTimes(1);
    expect(callback).not.toHaveBeenCalled();

    frameCallback?.(0);

    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('帧执行后允许下一轮重新调度', () => {
    const schedule = useRafCallback(vi.fn());

    schedule();
    frameCallback?.(0);
    schedule();

    expect(requestAnimationFrame).toHaveBeenCalledTimes(2);
  });

  it('清理时取消未执行的帧', () => {
    const schedule = useRafCallback(vi.fn());

    schedule();
    cleanup?.();

    expect(cancelAnimationFrame).toHaveBeenCalledWith(7);
  });
});
