import { useState, useEffect } from 'react';
import type { ShortcutAction, ShortcutConfig, ShortcutKey } from '../types';
import { parseJsonWithFallback, safeGetStorageItem, safeSetStorageItem } from '../utils/storage';
import {
    DEFAULT_SHORTCUTS,
    SHORTCUTS_STORAGE_KEY,
    handleShortcutKeyDown,
    normalizeShortcutConfig,
} from '../utils/shortcuts';

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
            safeGetStorageItem(SHORTCUTS_STORAGE_KEY),
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
        const handlers = {
            SAVE: onSave,
            FORMAT: onFormat,
            DEEP_FORMAT: onDeepFormat,
            MINIFY: onMinify,
            CLOSE_TAB: onCloseTab,
            TOGGLE_JSONPATH: onToggleJsonPath,
            NEW_TAB: onNewTab,
        };
        const handleKeyDown = (event: KeyboardEvent) => {
            handleShortcutKeyDown(event, shortcuts, handlers);
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
