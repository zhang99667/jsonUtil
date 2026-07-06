import { describe, expect, it } from 'vitest';
import { DEFAULT_GENERAL_SETTINGS } from '../types';
import {
  GENERAL_SETTINGS_STORAGE_KEY,
  loadGeneralSettings,
  normalizeGeneralSettings,
} from './appSettings';
import { MemoryStorage } from './memoryStorageTestHelper';

describe('app settings', () => {
  it('新用户默认开启深度格式化 CMD/Scheme 自动展开', () => {
    expect(DEFAULT_GENERAL_SETTINGS.autoExpandSchemeInDeepFormat).toBe(true);
    expect(normalizeGeneralSettings({}).autoExpandSchemeInDeepFormat).toBe(true);
    expect(loadGeneralSettings(new MemoryStorage()).autoExpandSchemeInDeepFormat).toBe(true);
  });

  it('保留用户显式关闭的深度格式化自动展开设置', () => {
    const storage = new MemoryStorage();
    storage.setItem(GENERAL_SETTINGS_STORAGE_KEY, JSON.stringify({
      autoExpandSchemeInDeepFormat: false,
    }));

    expect(normalizeGeneralSettings({
      autoExpandSchemeInDeepFormat: false,
    }).autoExpandSchemeInDeepFormat).toBe(false);
    expect(loadGeneralSettings(storage).autoExpandSchemeInDeepFormat).toBe(false);
  });
});
