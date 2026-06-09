import { describe, expect, it } from 'vitest';
import { DEFAULT_GENERAL_SETTINGS } from '../types';
import {
  GENERAL_SETTINGS_STORAGE_KEY,
  loadGeneralSettings,
  normalizeGeneralSettings,
} from './appSettings';

class MemoryStorage implements Storage {
  private data = new Map<string, string>();

  get length() {
    return this.data.size;
  }

  clear(): void {
    this.data.clear();
  }

  getItem(key: string): string | null {
    return this.data.get(key) ?? null;
  }

  key(index: number): string | null {
    return Array.from(this.data.keys())[index] ?? null;
  }

  removeItem(key: string): void {
    this.data.delete(key);
  }

  setItem(key: string, value: string): void {
    this.data.set(key, value);
  }
}

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
