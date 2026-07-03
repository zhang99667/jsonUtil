import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  notifyFloatingPanelLayoutReset,
  resetFloatingPanelLayoutStorage,
} from '../utils/panelLayout';
import { showSuccess } from '../utils/toast';
import { useAppPanelLayoutResetCommand } from './useAppPanelLayoutResetCommand';

const reactMocks = vi.hoisted(() => ({ useCallback: vi.fn() }));

vi.mock('react', async importOriginal => ({
  ...await importOriginal<typeof import('react')>(),
  useCallback: reactMocks.useCallback,
}));

vi.mock('../utils/panelLayout', () => ({
  notifyFloatingPanelLayoutReset: vi.fn(),
  resetFloatingPanelLayoutStorage: vi.fn(),
}));

vi.mock('../utils/toast', () => ({
  showSuccess: vi.fn(),
}));

describe('useAppPanelLayoutResetCommand', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    reactMocks.useCallback.mockImplementation((callback: unknown) => callback);
  });

  it('重置浮动面板布局并提示成功', () => {
    const { handleResetPanelLayout } = useAppPanelLayoutResetCommand();

    handleResetPanelLayout();

    expect(resetFloatingPanelLayoutStorage).toHaveBeenCalledTimes(1);
    expect(notifyFloatingPanelLayoutReset).toHaveBeenCalledTimes(1);
    expect(vi.mocked(resetFloatingPanelLayoutStorage).mock.invocationCallOrder[0])
      .toBeLessThan(vi.mocked(notifyFloatingPanelLayoutReset).mock.invocationCallOrder[0]);
    expect(showSuccess).toHaveBeenCalledWith('浮动面板布局已恢复默认');
  });
});
