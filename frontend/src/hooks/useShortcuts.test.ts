import { describe, expect, it } from 'vitest';
import { DEFAULT_SHORTCUTS, normalizeShortcutConfig } from './useShortcuts';

describe('normalizeShortcutConfig', () => {
  it('非法配置回退默认快捷键', () => {
    expect(normalizeShortcutConfig(null)).toBe(DEFAULT_SHORTCUTS);
  });

  it('保留合法自定义项并回退坏掉的动作', () => {
    const result = normalizeShortcutConfig({
      SAVE: { key: 'S', meta: false, ctrl: true, shift: false, alt: false },
      FORMAT: null,
    });

    expect(result.SAVE).toEqual({ key: 'S', meta: false, ctrl: true, shift: false, alt: false });
    expect(result.FORMAT).toEqual(DEFAULT_SHORTCUTS.FORMAT);
  });
});
