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
    CLOSE_TAB: '关闭标签 (Close Tab)',
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
    }, [recordingAction, onUpdateShortcut, shortcuts]);

    if (!isOpen) return null;

    const renderKey = (label: string) => (
        <kbd className="px-2 py-1 bg-[#333] border border-[#454545] border-b-[3px] rounded text-xs font-mono text-gray-200 min-w-[24px] text-center inline-block mx-0.5 shadow-sm">
            {label}
        </kbd>
    );

    const formatShortcut = (shortcut: ShortcutKey) => {
        if (!shortcut.key) return <span className="text-gray-500 italic text-xs">未设置</span>;

        const parts = [];
        if (shortcut.meta) parts.push(renderKey('Cmd'));
        if (shortcut.ctrl) parts.push(renderKey('Ctrl'));
        if (shortcut.alt) parts.push(renderKey('Alt'));
        if (shortcut.shift) parts.push(renderKey('Shift'));

        let key = shortcut.key;
        if (key === ' ') key = 'Space';
        if (key.length === 1) key = key.toUpperCase();
        parts.push(renderKey(key));

        return <div className="flex items-center flex-wrap justify-end">{parts}</div>;
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm animate-fade-in">
            <div className="bg-[#1e1e1e] border border-[#333] rounded-xl shadow-2xl w-full max-w-2xl p-0 overflow-hidden flex flex-col max-h-[80vh]">
                <div className="flex justify-between items-center p-5 border-b border-[#333] bg-[#252526]">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-blue-500/10 rounded-lg">
                            <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
                        </div>
                        <h2 className="text-lg font-semibold text-white">快捷键设置</h2>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors p-1 hover:bg-[#333] rounded-md">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <div className="p-6 overflow-y-auto custom-scrollbar">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {(Object.keys(shortcuts) as ShortcutAction[]).map((action) => (
                            <div
                                key={action}
                                onClick={() => setRecordingAction(action)}
                                className={`flex justify-between items-center bg-[#252526] p-4 rounded-lg border transition-all cursor-pointer group ${recordingAction === action
                                        ? 'border-blue-500 bg-blue-500/5 ring-1 ring-blue-500/50'
                                        : 'border-[#333] hover:border-[#555] hover:bg-[#2a2d2e]'
                                    }`}
                            >
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium text-gray-200 group-hover:text-white transition-colors">
                                        {ACTION_LABELS[action].split(' (')[0]}
                                    </span>
                                    <span className="text-[10px] text-gray-500 font-mono mt-0.5">
                                        {ACTION_LABELS[action].split(' (')[1]?.replace(')', '')}
                                    </span>
                                </div>

                                <div className="flex items-center">
                                    {recordingAction === action ? (
                                        <span className="text-xs text-blue-400 animate-pulse font-medium px-2 py-1 bg-blue-500/10 rounded">
                                            按下按键...
                                        </span>
                                    ) : (
                                        formatShortcut(shortcuts[action])
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="p-4 border-t border-[#333] bg-[#252526] flex justify-between items-center">
                    <button
                        onClick={onResetDefaults}
                        className="text-xs text-gray-500 hover:text-red-400 transition-colors flex items-center gap-1.5 px-3 py-2 rounded hover:bg-[#333]"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                        恢复默认设置
                    </button>
                    <button
                        onClick={onClose}
                        className="bg-[#007acc] hover:bg-[#0062a3] text-white px-6 py-2 rounded-md text-sm font-medium transition-colors shadow-lg shadow-blue-900/20"
                    >
                        完成
                    </button>
                </div>
            </div>
        </div>
    );
};
