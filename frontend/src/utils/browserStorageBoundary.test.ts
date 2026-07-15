import { afterEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_GENERAL_SETTINGS } from '../types';
import {
  DEFAULT_AI_CONFIG,
  loadAIConfig,
  loadGeneralSettings,
  loadTemplateFillConfig,
} from './appSettings';
import { resetFloatingPanelLayoutStorage } from './panelLayout';
import {
  safeGetStorageItem,
  safeReadStorageItem,
  safeRemoveStorageItem,
  safeSetStorageItem,
} from './storage';
import { loadWorkspaceDraftSnapshot, saveWorkspaceDraftSnapshot } from './workspaceDraft';

const runWithBlockedLocalStorage = (run: () => void): void => {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');

  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    get: () => {
      throw new Error('浏览器拒绝访问本地存储');
    },
  });

  try {
    run();
  } finally {
    if (descriptor) {
      Object.defineProperty(globalThis, 'localStorage', descriptor);
    } else {
      Reflect.deleteProperty(globalThis, 'localStorage');
    }
  }
};

describe('浏览器存储边界', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('浏览器拒绝访问本地存储时安全入口降级而不抛错', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    runWithBlockedLocalStorage(() => {
      expect(safeReadStorageItem('key')).toEqual({ value: null, ok: false });
      expect(safeGetStorageItem('key')).toBeNull();
      expect(safeSetStorageItem('key', 'value')).toBe(false);
      expect(safeRemoveStorageItem('key')).toBe(false);

      expect(loadGeneralSettings()).toEqual(DEFAULT_GENERAL_SETTINGS);
      expect(loadAIConfig()).toEqual(DEFAULT_AI_CONFIG);
      expect(loadTemplateFillConfig()).toEqual({ template: '', lastUpdated: 0 });
      expect(loadWorkspaceDraftSnapshot()).toBeNull();
      expect(saveWorkspaceDraftSnapshot(null)).toBe(false);
      expect(() => resetFloatingPanelLayoutStorage()).not.toThrow();
    });

    expect(warnSpy).toHaveBeenCalled();
  });
});
