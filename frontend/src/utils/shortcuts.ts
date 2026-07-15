import type { ShortcutAction, ShortcutConfig, ShortcutKey } from '../types';
import { isRecord } from './storage';

export const SHORTCUTS_STORAGE_KEY = 'json-helper-shortcuts';

export const DEFAULT_SHORTCUTS: ShortcutConfig = {
  SAVE: { key: 's', meta: true, ctrl: false, shift: false, alt: false },
  FORMAT: { key: 'f', meta: true, ctrl: false, shift: true, alt: false },
  DEEP_FORMAT: { key: 'Enter', meta: true, ctrl: false, shift: false, alt: false },
  MINIFY: { key: 'm', meta: true, ctrl: false, shift: true, alt: false },
  CLOSE_TAB: { key: 'w', meta: true, ctrl: false, shift: false, alt: true },
  TOGGLE_JSONPATH: { key: 'f', meta: false, ctrl: true, shift: true, alt: false },
  NEW_TAB: { key: 'n', meta: true, ctrl: false, shift: false, alt: false },
};

export const SHORTCUT_ACTIONS = Object.keys(DEFAULT_SHORTCUTS) as ShortcutAction[];

type ShortcutHandlers = Record<ShortcutAction, () => void>;

const matchesShortcut = (event: KeyboardEvent, shortcut: ShortcutKey): boolean => {
  if (!shortcut.key) return false;

  return (
    event.key.toLowerCase() === shortcut.key.toLowerCase() &&
    event.metaKey === shortcut.meta &&
    event.ctrlKey === shortcut.ctrl &&
    event.shiftKey === shortcut.shift &&
    event.altKey === shortcut.alt
  );
};

export const handleShortcutKeyDown = (
  event: KeyboardEvent,
  shortcuts: ShortcutConfig,
  handlers: ShortcutHandlers
): void => {
  for (const action of SHORTCUT_ACTIONS) {
    if (!matchesShortcut(event, shortcuts[action])) continue;

    event.preventDefault();
    if (!event.repeat) handlers[action]();
    return;
  }
};

const isShortcutKey = (value: unknown): value is ShortcutKey => {
  if (!isRecord(value)) return false;

  return (
    typeof value.key === 'string' &&
    typeof value.meta === 'boolean' &&
    typeof value.ctrl === 'boolean' &&
    typeof value.shift === 'boolean' &&
    typeof value.alt === 'boolean'
  );
};

export const normalizeShortcutConfig = (value: unknown): ShortcutConfig => {
  if (!isRecord(value)) return DEFAULT_SHORTCUTS;

  const next: ShortcutConfig = { ...DEFAULT_SHORTCUTS };
  for (const action of SHORTCUT_ACTIONS) {
    const shortcut = value[action];
    if (isShortcutKey(shortcut)) {
      next[action] = shortcut;
    }
  }

  return next;
};
