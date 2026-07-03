import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAppSettingsState } from './useAppSettingsState';
import {
  AI_CONFIG_STORAGE_KEY,
  GENERAL_SETTINGS_STORAGE_KEY,
  loadAIConfig,
  loadGeneralSettings,
} from '../utils/appSettings';
import { safeSetStorageItem } from '../utils/storage';

const reactMocks = vi.hoisted(() => ({
  useEffect: vi.fn(),
  useState: vi.fn(),
}));

const settingsMocks = vi.hoisted(() => ({
  generalSettings: { autoExpandSchemeInDeepFormat: false },
  aiConfig: { provider: 'gemini', apiKey: 'secret', model: 'gemini-2.0-flash' },
  loadGeneralSettings: vi.fn(),
  loadAIConfig: vi.fn(),
}));

vi.mock('react', async importOriginal => ({
  ...await importOriginal<typeof import('react')>(),
  useEffect: reactMocks.useEffect,
  useState: reactMocks.useState,
}));

vi.mock('../utils/appSettings', async importOriginal => ({
  ...await importOriginal<typeof import('../utils/appSettings')>(),
  loadGeneralSettings: settingsMocks.loadGeneralSettings,
  loadAIConfig: settingsMocks.loadAIConfig,
}));

vi.mock('../utils/storage', async importOriginal => ({
  ...await importOriginal<typeof import('../utils/storage')>(),
  safeSetStorageItem: vi.fn(),
}));

describe('useAppSettingsState', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    settingsMocks.loadGeneralSettings.mockReturnValue(settingsMocks.generalSettings);
    settingsMocks.loadAIConfig.mockReturnValue(settingsMocks.aiConfig);
    reactMocks.useEffect.mockImplementation((effect: () => void) => effect());
    reactMocks.useState.mockImplementation((initializer: unknown) => {
      const value = typeof initializer === 'function'
        ? (initializer as () => unknown)()
        : initializer;

      return [value, vi.fn()];
    });
  });

  it('从本地配置初始化设置状态并持久化最新值', () => {
    const state = useAppSettingsState();

    expect(loadGeneralSettings).toHaveBeenCalledTimes(1);
    expect(loadAIConfig).toHaveBeenCalledTimes(1);
    expect(state.generalSettings).toBe(settingsMocks.generalSettings);
    expect(state.aiConfig).toBe(settingsMocks.aiConfig);
    expect(safeSetStorageItem).toHaveBeenCalledWith(
      GENERAL_SETTINGS_STORAGE_KEY,
      JSON.stringify(settingsMocks.generalSettings)
    );
    expect(safeSetStorageItem).toHaveBeenCalledWith(
      AI_CONFIG_STORAGE_KEY,
      JSON.stringify(settingsMocks.aiConfig)
    );
  });
});
