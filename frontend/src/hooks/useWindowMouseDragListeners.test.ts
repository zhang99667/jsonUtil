import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useWindowMouseDragListeners } from './useWindowMouseDragListeners';

const reactMocks = vi.hoisted(() => ({
  useEffect: vi.fn(),
}));

vi.mock('react', async importOriginal => ({
  ...await importOriginal<typeof import('react')>(),
  useEffect: reactMocks.useEffect,
}));

describe('useWindowMouseDragListeners', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('window', {
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
    reactMocks.useEffect.mockImplementation((effect: () => void | (() => void)) => effect());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('未激活时不挂载窗口鼠标监听', () => {
    useWindowMouseDragListeners({
      isActive: false,
      onMouseMove: vi.fn(),
      onMouseUp: vi.fn(),
    });

    expect(window.addEventListener).not.toHaveBeenCalled();
  });

  it('激活时挂载并在 cleanup 移除窗口鼠标监听', () => {
    const onMouseMove = vi.fn();
    const onMouseUp = vi.fn();
    let cleanup: (() => void) | undefined;
    reactMocks.useEffect.mockImplementation((effect: () => void | (() => void)) => {
      const result = effect();
      cleanup = typeof result === 'function' ? result : undefined;
    });

    useWindowMouseDragListeners({ isActive: true, onMouseMove, onMouseUp });
    cleanup?.();

    expect(window.addEventListener).toHaveBeenCalledWith('mousemove', onMouseMove);
    expect(window.addEventListener).toHaveBeenCalledWith('mouseup', onMouseUp);
    expect(window.removeEventListener).toHaveBeenCalledWith('mousemove', onMouseMove);
    expect(window.removeEventListener).toHaveBeenCalledWith('mouseup', onMouseUp);
  });
});
