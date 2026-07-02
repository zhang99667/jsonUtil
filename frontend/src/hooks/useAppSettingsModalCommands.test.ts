import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAppSettingsModalCommands } from './useAppSettingsModalCommands';

const reactMocks = vi.hoisted(() => ({
  useCallback: vi.fn(),
  useState: vi.fn(),
}));

vi.mock('react', async importOriginal => ({
  ...await importOriginal<typeof import('react')>(),
  useCallback: reactMocks.useCallback,
  useState: reactMocks.useState,
}));

describe('useAppSettingsModalCommands', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    reactMocks.useCallback.mockImplementation((callback: unknown) => callback);
  });

  it('打开设置面板时切到快捷键页并记录事件', () => {
    const setIsSettingsModalOpen = vi.fn();
    const setSettingsInitialTab = vi.fn();
    const onTrackToolEvent = vi.fn();
    reactMocks.useState
      .mockReturnValueOnce([false, setIsSettingsModalOpen])
      .mockReturnValueOnce(['shortcuts', setSettingsInitialTab]);

    const commands = useAppSettingsModalCommands({ onTrackToolEvent });
    commands.handleOpenSettingsPanel();

    expect(setSettingsInitialTab).toHaveBeenCalledWith('shortcuts');
    expect(setIsSettingsModalOpen).toHaveBeenCalledWith(true);
    expect(onTrackToolEvent).toHaveBeenCalledWith('SETTINGS_OPEN', 'panel');
  });

  it('打开 AI 设置时只切到 AI 页并展示弹窗', () => {
    const setIsSettingsModalOpen = vi.fn();
    const setSettingsInitialTab = vi.fn();
    const onTrackToolEvent = vi.fn();
    reactMocks.useState
      .mockReturnValueOnce([false, setIsSettingsModalOpen])
      .mockReturnValueOnce(['shortcuts', setSettingsInitialTab]);

    const commands = useAppSettingsModalCommands({ onTrackToolEvent });
    commands.handleOpenAiSettings();

    expect(setSettingsInitialTab).toHaveBeenCalledWith('ai');
    expect(setIsSettingsModalOpen).toHaveBeenCalledWith(true);
    expect(onTrackToolEvent).not.toHaveBeenCalled();
  });
});
