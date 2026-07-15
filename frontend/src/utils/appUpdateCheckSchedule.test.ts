import { describe, expect, it, vi } from 'vitest';
import { installAppUpdateCheckSchedule } from './appUpdateCheckSchedule';

const createTargets = () => {
  const windowListeners: Record<string, () => void> = {};
  const documentListeners: Record<string, () => void> = {};
  const windowTarget = {
    setTimeout: vi.fn((_callback: () => void | Promise<void>, _delayMs: number) => 11),
    clearTimeout: vi.fn(),
    setInterval: vi.fn((_callback: () => void | Promise<void>, _delayMs: number) => 22),
    clearInterval: vi.fn(),
    addEventListener: vi.fn((type: string, listener: () => void) => {
      windowListeners[type] = listener;
    }),
    removeEventListener: vi.fn(),
  };
  const documentTarget = {
    visibilityState: 'hidden' as DocumentVisibilityState,
    addEventListener: vi.fn((type: string, listener: () => void) => {
      documentListeners[type] = listener;
    }),
    removeEventListener: vi.fn(),
  };

  return {
    documentListeners,
    documentTarget,
    windowListeners,
    windowTarget,
  };
};

describe('appUpdateCheckSchedule', () => {
  it('安装初始轮询、周期轮询和前台恢复检查监听', () => {
    const checkForUpdate = vi.fn();
    const {
      documentListeners,
      documentTarget,
      windowListeners,
      windowTarget,
    } = createTargets();

    installAppUpdateCheckSchedule({
      checkForUpdate,
      windowTarget,
      documentTarget,
      initialDelayMs: 5000,
      intervalMs: 60000,
    });

    expect(windowTarget.setTimeout).toHaveBeenCalledWith(expect.any(Function), 5000);
    expect(windowTarget.setInterval).toHaveBeenCalledWith(
      windowTarget.setTimeout.mock.calls[0][0],
      60000
    );
    expect(documentTarget.addEventListener).toHaveBeenCalledWith('visibilitychange', expect.any(Function));
    expect(windowTarget.addEventListener).toHaveBeenCalledWith('focus', expect.any(Function));

    documentListeners.visibilitychange();
    expect(checkForUpdate).not.toHaveBeenCalled();

    documentTarget.visibilityState = 'visible';
    documentListeners.visibilitychange();
    windowListeners.focus();
    expect(checkForUpdate).toHaveBeenCalledTimes(2);
  });

  it('检查未结束时合并前台恢复触发，结束后允许下一轮', async () => {
    let resolveCheck = () => undefined;
    const checkForUpdate = vi.fn(() => new Promise<void>((resolve) => {
      resolveCheck = resolve;
    }));
    const {
      documentListeners,
      documentTarget,
      windowListeners,
      windowTarget,
    } = createTargets();
    documentTarget.visibilityState = 'visible';

    installAppUpdateCheckSchedule({
      checkForUpdate,
      windowTarget,
      documentTarget,
      initialDelayMs: 5000,
      intervalMs: 60000,
    });

    windowTarget.setTimeout.mock.calls[0][0]();
    documentListeners.visibilitychange();
    windowListeners.focus();
    expect(checkForUpdate).toHaveBeenCalledTimes(1);

    resolveCheck();
    await Promise.resolve();
    windowListeners.focus();
    expect(checkForUpdate).toHaveBeenCalledTimes(2);
  });

  it('同步异常和异步失败都会释放下一轮检查', async () => {
    let checkNumber = 0;
    const checkForUpdate = vi.fn(() => {
      checkNumber += 1;
      if (checkNumber === 1) throw new Error('同步失败');
      if (checkNumber === 2) return Promise.reject(new Error('异步失败'));
      return undefined;
    });
    const {
      documentTarget,
      windowListeners,
      windowTarget,
    } = createTargets();

    installAppUpdateCheckSchedule({
      checkForUpdate,
      windowTarget,
      documentTarget,
      initialDelayMs: 5000,
      intervalMs: 60000,
    });

    expect(() => windowListeners.focus()).not.toThrow();
    windowListeners.focus();
    expect(checkForUpdate).toHaveBeenCalledTimes(2);

    await Promise.resolve();
    windowListeners.focus();
    expect(checkForUpdate).toHaveBeenCalledTimes(3);
  });

  it('清理定时器并移除同一组监听函数', () => {
    const {
      documentTarget,
      windowTarget,
    } = createTargets();

    const cleanup = installAppUpdateCheckSchedule({
      checkForUpdate: vi.fn(),
      windowTarget,
      documentTarget,
      initialDelayMs: 5000,
      intervalMs: 60000,
    });
    cleanup();

    expect(windowTarget.clearTimeout).toHaveBeenCalledWith(11);
    expect(windowTarget.clearInterval).toHaveBeenCalledWith(22);
    expect(documentTarget.removeEventListener).toHaveBeenCalledWith(
      'visibilitychange',
      documentTarget.addEventListener.mock.calls[0][1]
    );
    expect(windowTarget.removeEventListener).toHaveBeenCalledWith(
      'focus',
      windowTarget.addEventListener.mock.calls[0][1]
    );
  });
});
