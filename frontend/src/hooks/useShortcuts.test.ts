import { describe, expect, it, vi } from 'vitest';
import {
  DEFAULT_SHORTCUTS,
  areShortcutKeysEquivalent,
  handleShortcutKeyDown,
  normalizeShortcutConfig,
} from '../utils/shortcuts';

describe('shortcuts', () => {
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

  it('匹配快捷键时只执行首次动作且未匹配按键保持原状', () => {
    const onDeepFormat = vi.fn();
    const event = {
      key: 'Enter',
      metaKey: true,
      ctrlKey: false,
      shiftKey: false,
      altKey: false,
      repeat: false,
      preventDefault: vi.fn(),
    } as unknown as KeyboardEvent;

    const handlers = {
      SAVE: vi.fn(),
      FORMAT: vi.fn(),
      DEEP_FORMAT: onDeepFormat,
      MINIFY: vi.fn(),
      CLOSE_TAB: vi.fn(),
      TOGGLE_JSONPATH: vi.fn(),
      NEW_TAB: vi.fn(),
    };
    const repeatedEvent = {
      ...event,
      repeat: true,
      preventDefault: vi.fn(),
    } as KeyboardEvent;
    const unmatchedEvent = {
      ...event,
      key: 'Escape',
      repeat: true,
      preventDefault: vi.fn(),
    } as KeyboardEvent;

    handleShortcutKeyDown(event, DEFAULT_SHORTCUTS, handlers);
    handleShortcutKeyDown(repeatedEvent, DEFAULT_SHORTCUTS, handlers);
    handleShortcutKeyDown(unmatchedEvent, DEFAULT_SHORTCUTS, handlers);

    expect(event.preventDefault).toHaveBeenCalledOnce();
    expect(repeatedEvent.preventDefault).toHaveBeenCalledOnce();
    expect(unmatchedEvent.preventDefault).not.toHaveBeenCalled();
    expect(Object.values(handlers).map(handler => handler.mock.calls.length)).toEqual([
      0, 0, 1, 0, 0, 0, 0,
    ]);
  });

  it('导入重复绑定时沿用既有动作优先级', () => {
    const handlers = {
      SAVE: vi.fn(),
      FORMAT: vi.fn(),
      DEEP_FORMAT: vi.fn(),
      MINIFY: vi.fn(),
      CLOSE_TAB: vi.fn(),
      TOGGLE_JSONPATH: vi.fn(),
      NEW_TAB: vi.fn(),
    };
    const event = {
      key: 's',
      metaKey: true,
      ctrlKey: false,
      shiftKey: false,
      altKey: false,
      repeat: false,
      preventDefault: vi.fn(),
    } as unknown as KeyboardEvent;

    handleShortcutKeyDown(event, {
      ...DEFAULT_SHORTCUTS,
      FORMAT: DEFAULT_SHORTCUTS.SAVE,
    }, handlers);

    expect(event.preventDefault).toHaveBeenCalledOnce();
    expect(handlers.SAVE).toHaveBeenCalledOnce();
    expect(handlers.FORMAT).not.toHaveBeenCalled();
  });

  it('全局处理器与录制模型共享大小写和修饰键等价语义', () => {
    expect(areShortcutKeysEquivalent(
      { ...DEFAULT_SHORTCUTS.SAVE, key: 'S' },
      DEFAULT_SHORTCUTS.SAVE,
    )).toBe(true);
    expect(areShortcutKeysEquivalent(
      { ...DEFAULT_SHORTCUTS.SAVE, key: 'S', ctrl: true },
      DEFAULT_SHORTCUTS.SAVE,
    )).toBe(false);

    const handlers = {
      SAVE: vi.fn(),
      FORMAT: vi.fn(),
      DEEP_FORMAT: vi.fn(),
      MINIFY: vi.fn(),
      CLOSE_TAB: vi.fn(),
      TOGGLE_JSONPATH: vi.fn(),
      NEW_TAB: vi.fn(),
    };
    const event = {
      key: 'S',
      metaKey: true,
      ctrlKey: false,
      shiftKey: false,
      altKey: false,
      repeat: false,
      preventDefault: vi.fn(),
    } as unknown as KeyboardEvent;

    handleShortcutKeyDown(event, DEFAULT_SHORTCUTS, handlers);

    expect(event.preventDefault).toHaveBeenCalledOnce();
    expect(handlers.SAVE).toHaveBeenCalledOnce();
  });
});
