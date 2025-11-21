import React, { useState, useEffect } from 'react';
import { ShortcutConfig, ShortcutKey, ShortcutAction } from '../types';

interface ShortcutModalProps {
    isOpen: boolean;
    onClose: () => void;
    shortcuts: ShortcutConfig;
    onUpdateShortcut: (action: ShortcutAction, key: ShortcutKey) => void;
    onResetDefaults: () => void;
}

const ACTION_LABELS: Record<ShortcutAction, string> = {
    SAVE: '保存 (Save)',
    FORMAT: '格式化 (Format)',
    DEEP_FORMAT: '深度格式化 (Deep Format)',
    MINIFY: '压缩 (Minify)',
};

export const ShortcutModal: React.FC<ShortcutModalProps> = ({
    isOpen,
    onClose,
    shortcuts,
    onUpdateShortcut,
    onResetDefaults,
}) => {
    const [recordingAction, setRecordingAction] = useState<ShortcutAction | null>(null);

    useEffect(() => {
        if (!recordingAction) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            e.preventDefault();
            e.stopPropagation();

            // Handle Backspace to clear shortcut
            if (e.key === 'Backspace' && !e.metaKey && !e.ctrlKey && !e.altKey && !e.shiftKey) {
                const emptyShortcut: ShortcutKey = { key: '', meta: false, ctrl: false, shift: false, alt: false };
                onUpdateShortcut(recordingAction, emptyShortcut);
                setRecordingAction(null);
                return;
            }

            // Ignore modifier-only keydowns
            if (['Meta', 'Control', 'Shift', 'Alt'].includes(e.key)) return;

            const newShortcut: ShortcutKey = {
                key: e.key,
                meta: e.metaKey,
                ctrl: e.ctrlKey,
                shift: e.shiftKey,
                alt: e.altKey,
            };

            // Check for conflicts
            const conflictingAction = (Object.keys(shortcuts) as ShortcutAction[]).find(action => {
                if (action === recordingAction) return false;
                const s = shortcuts[action];
                return (
                    s.key.toLowerCase() === newShortcut.key.toLowerCase() &&
                    s.meta === newShortcut.meta &&
                    s.ctrl === newShortcut.ctrl &&
                    s.shift === newShortcut.shift &&
                    s.alt === newShortcut.alt
                );
            });

            if (conflictingAction) {
                // Unbind the conflicting action
                const emptyShortcut: ShortcutKey = { key: '', meta: false, ctrl: false, shift: false, alt: false };
                onUpdateShortcut(conflictingAction, emptyShortcut);
            }

            onUpdateShortcut(recordingAction, newShortcut);
            setRecordingAction(null);
        };

        window.addEventListener('keydown', handleKeyDown, { capture: true });
        return () => window.removeEventListener('keydown', handleKeyDown, { capture: true });
    }, [recordingAction, onUpdateShortcut, shortcuts]); // Added shortcuts to dependency array

    if (!isOpen) return null;

    const formatShortcut = (shortcut: ShortcutKey) => {
        if (!shortcut.key) return '未设置';

        const parts = [];
        if (shortcut.meta) parts.push('Cmd');
        if (shortcut.ctrl) parts.push('Ctrl');
        if (shortcut.alt) parts.push('Alt');
        if (shortcut.shift) parts.push('Shift');

        let key = shortcut.key;
        if (key === ' ') key = 'Space';
        if (key.length === 1) key = key.toUpperCase();
        parts.push(key);

        return parts.join(' + ');
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
            <div className="bg-[#1e1e1e] border border-[#333] rounded-xl shadow-2xl w-full max-w-md p-6">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold text-white">快捷键设置</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <div className="space-y-4">
                    {(Object.keys(shortcuts) as ShortcutAction[]).map((action) => (
                        <div key={action} className="flex justify-between items-center bg-[#252526] p-3 rounded-lg border border-[#333]">
                            <span className="text-gray-300">{ACTION_LABELS[action]}</span>
                            <button
                                onClick={() => setRecordingAction(action)}
                                className={`px-3 py-1.5 rounded text-sm font-mono transition-colors border ${recordingAction === action
                                    ? 'bg-blue-500/20 border-blue-500 text-blue-300 animate-pulse'
                                    : 'bg-[#1e1e1e] border-[#444] text-gray-400 hover:border-gray-300 hover:text-gray-200'
                                    }`}
                            >
                                {recordingAction === action ? '按下按键...' : formatShortcut(shortcuts[action])}
                            </button>
                        </div>
                    ))}
                </div>

                <div className="mt-6 flex justify-between pt-4 border-t border-[#333]">
                    <button
                        onClick={onResetDefaults}
                        className="text-sm text-gray-500 hover:text-red-400 transition-colors"
                    >
                        恢复默认
                    </button>
                    <button
                        onClick={onClose}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                        完成
                    </button>
                </div>
            </div>
        </div>
    );
};
