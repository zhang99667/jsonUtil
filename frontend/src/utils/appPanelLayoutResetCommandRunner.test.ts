import { beforeEach, describe, expect, it, vi } from 'vitest';
import { notifyFloatingPanelLayoutReset, resetFloatingPanelLayoutStorage } from './panelLayout';
import { runAppPanelLayoutResetCommand } from './appPanelLayoutResetCommandRunner';
import { showSuccess } from './toast';

vi.mock('./panelLayout', () => ({
  notifyFloatingPanelLayoutReset: vi.fn(),
  resetFloatingPanelLayoutStorage: vi.fn(),
}));

vi.mock('./toast', () => ({
  showSuccess: vi.fn(),
}));

describe('appPanelLayoutResetCommandRunner', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('清理布局缓存后通知面板刷新并提示成功', () => {
    runAppPanelLayoutResetCommand();

    expect(resetFloatingPanelLayoutStorage).toHaveBeenCalledTimes(1);
    expect(notifyFloatingPanelLayoutReset).toHaveBeenCalledTimes(1);
    expect(vi.mocked(resetFloatingPanelLayoutStorage).mock.invocationCallOrder[0])
      .toBeLessThan(vi.mocked(notifyFloatingPanelLayoutReset).mock.invocationCallOrder[0]);
    expect(showSuccess).toHaveBeenCalledWith('浮动面板布局已恢复默认');
  });
});
