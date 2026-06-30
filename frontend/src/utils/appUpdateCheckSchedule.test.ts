import { describe, expect, it, vi } from 'vitest';
import { installAppUpdateCheckSchedule } from './appUpdateCheckSchedule';

const createTargets = () => {
  const windowListeners: Record<string, () => void> = {};
  const documentListeners: Record<string, () => void> = {};
  const windowTarget = {
    setTimeout: vi.fn(() => 11),
    clearTimeout: vi.fn(),
    setInterval: vi.fn(() => 22),
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

    expect(windowTarget.setTimeout).toHaveBeenCalledWith(checkForUpdate, 5000);
    expect(windowTarget.setInterval).toHaveBeenCalledWith(checkForUpdate, 60000);
    expect(documentTarget.addEventListener).toHaveBeenCalledWith('visibilitychange', expect.any(Function));
    expect(windowTarget.addEventListener).toHaveBeenCalledWith('focus', expect.any(Function));

    documentListeners.visibilitychange();
    expect(checkForUpdate).not.toHaveBeenCalled();

    documentTarget.visibilityState = 'visible';
    documentListeners.visibilitychange();
    windowListeners.focus();
    expect(checkForUpdate).toHaveBeenCalledTimes(2);
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
