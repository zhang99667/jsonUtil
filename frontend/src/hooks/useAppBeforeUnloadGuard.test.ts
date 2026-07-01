import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useAppBeforeUnloadGuard } from './useAppBeforeUnloadGuard';

const reactMocks = vi.hoisted(() => ({
  useEffect: vi.fn(),
}));

vi.mock('react', async importOriginal => ({
  ...await importOriginal<typeof import('react')>(),
  useEffect: reactMocks.useEffect,
}));

describe('useAppBeforeUnloadGuard', () => {
  const listeners = new Map<string, EventListener>();

  beforeEach(() => {
    vi.clearAllMocks();
    listeners.clear();
    reactMocks.useEffect.mockImplementation((effect: () => void | (() => void)) => effect());
    vi.stubGlobal('window', {
      addEventListener: vi.fn((type: string, listener: EventListener) => {
        listeners.set(type, listener);
      }),
      removeEventListener: vi.fn(),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('有未保存内容时阻止直接离开页面', () => {
    const preventDefault = vi.fn();
    const event = { preventDefault, returnValue: undefined } as unknown as BeforeUnloadEvent;

    useAppBeforeUnloadGuard(true);
    listeners.get('beforeunload')?.(event);

    expect(preventDefault).toHaveBeenCalledTimes(1);
    expect(event.returnValue).toBe('');
  });

  it('无未保存内容时不拦截离开页面', () => {
    const preventDefault = vi.fn();
    const event = { preventDefault, returnValue: undefined } as unknown as BeforeUnloadEvent;

    useAppBeforeUnloadGuard(false);
    listeners.get('beforeunload')?.(event);

    expect(preventDefault).not.toHaveBeenCalled();
    expect(event.returnValue).toBeUndefined();
  });

  it('effect 清理时移除 beforeunload 监听', () => {
    let cleanup: (() => void) | undefined;
    reactMocks.useEffect.mockImplementation((effect: () => void | (() => void)) => {
      const result = effect();
      cleanup = typeof result === 'function' ? result : undefined;
    });

    useAppBeforeUnloadGuard(true);
    cleanup?.();

    expect(window.removeEventListener).toHaveBeenCalledWith('beforeunload', listeners.get('beforeunload'));
  });
});
