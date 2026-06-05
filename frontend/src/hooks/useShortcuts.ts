import { useState, useEffect } from 'react';
import { ShortcutConfig, ShortcutKey, ShortcutAction } from '../types';
import { isRecord, parseJsonWithFallback } from '../utils/storage';

export const DEFAULT_SHORTCUTS: ShortcutConfig = {
    SAVE: { key: 's', meta: true, ctrl: false, shift: false, alt: false },
    FORMAT: { key: 'f', meta: true, ctrl: false, shift: true, alt: false },
    DEEP_FORMAT: { key: 'Enter', meta: true, ctrl: false, shift: false, alt: false },
    MINIFY: { key: 'm', meta: true, ctrl: false, shift: true, alt: false },
    CLOSE_TAB: { key: 'w', meta: true, ctrl: false, shift: false, alt: true },
    TOGGLE_JSONPATH: { key: 'f', meta: false, ctrl: true, shift: true, alt: false },
    NEW_TAB: { key: 'n', meta: true, ctrl: false, shift: false, alt: false },
};

const SHORTCUTS_STORAGE_KEY = 'json-helper-shortcuts';
const SHORTCUT_ACTIONS = Object.keys(DEFAULT_SHORTCUTS) as ShortcutAction[];

interface UseShortcutsProps {
    onSave: () => void;
    onFormat: () => void;
    onDeepFormat: () => void;
    onMinify: () => void;
    onCloseTab: () => void;
    onToggleJsonPath: () => void;
    onNewTab: () => void;
}

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

export const useShortcuts = ({
    onSave,
    onFormat,
    onDeepFormat,
    onMinify,
    onCloseTab,
    onToggleJsonPath,
    onNewTab,
}: UseShortcutsProps) => {
    const [shortcuts, setShortcuts] = useState<ShortcutConfig>(() => {
        const saved = parseJsonWithFallback<unknown>(
            localStorage.getItem(SHORTCUTS_STORAGE_KEY),
            null
        );
        return normalizeShortcutConfig(saved);
    });

    useEffect(() => {
        localStorage.setItem(SHORTCUTS_STORAGE_KEY, JSON.stringify(shortcuts));
    }, [shortcuts]);

    const updateShortcut = (action: ShortcutAction, key: ShortcutKey) => {
        setShortcuts(prev => ({ ...prev, [action]: key }));
    };

    const resetShortcuts = () => {
        setShortcuts(DEFAULT_SHORTCUTS);
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // 快捷键匹配辅助函数
            const matches = (shortcut: ShortcutKey) => {
                if (!shortcut.key) return false;
                return (
                    e.key.toLowerCase() === shortcut.key.toLowerCase() &&
                    e.metaKey === shortcut.meta &&
                    e.ctrlKey === shortcut.ctrl &&
                    e.shiftKey === shortcut.shift &&
                    e.altKey === shortcut.alt
                );
            };

            // 保存操作
            if (matches(shortcuts.SAVE)) {
                e.preventDefault();
                onSave();
                return;
            }

            // 格式化操作
            if (matches(shortcuts.FORMAT)) {
                e.preventDefault();
                onFormat();
                return;
            }

            // 深度格式化操作
            if (matches(shortcuts.DEEP_FORMAT)) {
                e.preventDefault();
                onDeepFormat();
                return;
            }

            // 压缩操作
            if (matches(shortcuts.MINIFY)) {
                e.preventDefault();
                onMinify();
                return;
            }

            // 关闭标签操作
            if (matches(shortcuts.CLOSE_TAB)) {
                e.preventDefault();
                onCloseTab();
                return;
            }

            // 切换 JSONPath 面板显示
            if (matches(shortcuts.TOGGLE_JSONPATH)) {
                e.preventDefault();
                onToggleJsonPath();
                return;
            }

            // 新建标签操作
            if (matches(shortcuts.NEW_TAB)) {
                e.preventDefault();
                onNewTab();
                return;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [shortcuts, onSave, onFormat, onDeepFormat, onMinify, onCloseTab, onToggleJsonPath, onNewTab]);

    return {
        shortcuts,
        updateShortcut,
        resetShortcuts
    };
};
