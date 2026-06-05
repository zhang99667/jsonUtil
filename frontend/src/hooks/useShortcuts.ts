import { useState, useEffect } from 'react';
import { ShortcutConfig, ShortcutKey, ShortcutAction } from '../types';
import { parseJsonWithFallback, safeSetStorageItem } from '../utils/storage';
import { DEFAULT_SHORTCUTS, SHORTCUTS_STORAGE_KEY, normalizeShortcutConfig } from '../utils/shortcuts';

export { DEFAULT_SHORTCUTS, normalizeShortcutConfig } from '../utils/shortcuts';

interface UseShortcutsProps {
    onSave: () => void;
    onFormat: () => void;
    onDeepFormat: () => void;
    onMinify: () => void;
    onCloseTab: () => void;
    onToggleJsonPath: () => void;
    onNewTab: () => void;
}

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
        safeSetStorageItem(SHORTCUTS_STORAGE_KEY, JSON.stringify(shortcuts));
    }, [shortcuts]);

    const updateShortcut = (action: ShortcutAction, key: ShortcutKey) => {
        setShortcuts(prev => ({ ...prev, [action]: key }));
    };

    const resetShortcuts = () => {
        setShortcuts(DEFAULT_SHORTCUTS);
    };

    const replaceShortcuts = (nextShortcuts: ShortcutConfig) => {
        setShortcuts(normalizeShortcutConfig(nextShortcuts));
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
        resetShortcuts,
        replaceShortcuts,
    };
};
