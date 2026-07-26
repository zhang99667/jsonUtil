import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { ShortcutConfig, ShortcutKey, ShortcutAction, AIConfig, AIProvider, GeneralSettings } from '../types';
import { useUnifiedSettingsAIConfig } from '../hooks/useUnifiedSettingsAIConfig';
import { getAIProviderBaseUrlPlaceholder, getAIProviderDefaultModel } from '../utils/aiProviderDefaults';
import { SHORTCUT_ACTIONS } from '../utils/shortcuts';
import { SETTINGS_DIALOG_TOASTER_ID } from '../utils/toast';
import { AppToastHost } from './AppToastHost';
import { NativeDialog } from './NativeDialog';
import {
    getShortcutDisplayLabels,
    resolveShortcutRecordingInput,
} from './UnifiedSettingsShortcutModel';

interface UnifiedSettingsModalProps {
    isOpen: boolean;
    initialTab?: TabType;
    onClose: () => void;
    shortcuts: ShortcutConfig;
    onUpdateShortcut: (action: ShortcutAction, key: ShortcutKey) => void;
    onResetShortcuts: () => void;
    aiConfig: AIConfig;
    onSaveAIConfig: (config: AIConfig) => void;
    generalSettings: GeneralSettings;
    onSaveGeneralSettings: (s: GeneralSettings) => void;
    onResetPanelLayout: () => void;
    onExportSettingsBackup: () => void;
    onImportSettingsBackup: (file: File) => void;
}

const ACTION_LABELS: Record<ShortcutAction, string> = {
    SAVE: '保存 (Save)',
    FORMAT: '格式化 (Format)',
    DEEP_FORMAT: '深度格式化 (Deep Format)',
    MINIFY: '压缩 (Minify)',
    CLOSE_TAB: '关闭标签 (Close Tab)',
    TOGGLE_JSONPATH: '切换查询面板 (Toggle Query Panel)',
    NEW_TAB: '新建标签 (New Tab)',
};

type TabType = 'shortcuts' | 'ai' | 'general';

const SETTINGS_TABS: Array<{ type: TabType; label: string; tabId: string; panelId: string }> = [
    { type: 'general', label: '通用设置', tabId: 'settings-tab-general', panelId: 'settings-panel-general' },
    { type: 'ai', label: 'AI 配置', tabId: 'settings-tab-ai', panelId: 'settings-panel-ai' },
    { type: 'shortcuts', label: '快捷键', tabId: 'settings-tab-shortcuts', panelId: 'settings-panel-shortcuts' },
];

const getActionName = (action: ShortcutAction): string => (
    ACTION_LABELS[action].split(' (')[0]
);

export const UnifiedSettingsModal: React.FC<UnifiedSettingsModalProps> = ({
    isOpen,
    initialTab = 'general',
    onClose,
    shortcuts,
    onUpdateShortcut,
    onResetShortcuts,
    aiConfig,
    onSaveAIConfig,
    generalSettings,
    onSaveGeneralSettings,
    onResetPanelLayout,
    onExportSettingsBackup,
    onImportSettingsBackup,
}) => {
    const [activeTab, setActiveTab] = useState<TabType>('general');
    const [recordingAction, setRecordingAction] = useState<ShortcutAction | null>(null);
    const [shortcutConflictNotice, setShortcutConflictNotice] = useState('');
    const [localGeneralSettings, setLocalGeneralSettings] = useState<GeneralSettings>(generalSettings);
    const tabButtonRefs = useRef<Record<TabType, HTMLButtonElement | null>>({
        shortcuts: null,
        ai: null,
        general: null,
    });
    const importBackupInputRef = useRef<HTMLInputElement | null>(null);
    const {
        config: localAIConfig,
        isTesting: isTestingAI,
        testResult: aiTestResult,
        updateConfig: updateLocalAIConfig,
        changeProvider: handleAIProviderChange,
        saveConfig: handleSaveAI,
        testConnection: handleTestAIConnection,
    } = useUnifiedSettingsAIConfig({
        isOpen,
        initialConfig: aiConfig,
        onSave: onSaveAIConfig,
        onClose,
    });

    useEffect(() => {
        if (isOpen) return;
        setRecordingAction(null);
    }, [isOpen]);

    useEffect(() => {
        if (isOpen) {
            setLocalGeneralSettings(generalSettings);
            setShortcutConflictNotice('');
        }
    }, [isOpen, generalSettings]);

    useEffect(() => {
        if (isOpen) {
            setActiveTab(initialTab);
        }
    }, [isOpen, initialTab]);

    useLayoutEffect(() => {
        if (!isOpen || activeTab !== 'shortcuts' || !recordingAction) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            e.preventDefault();
            e.stopPropagation();

            const result = resolveShortcutRecordingInput({
                key: e.key,
                meta: e.metaKey,
                ctrl: e.ctrlKey,
                shift: e.shiftKey,
                alt: e.altKey,
                repeat: e.repeat,
            }, recordingAction, shortcuts);
            if (result.type === 'ignored') {
                return;
            }

            if (result.type === 'bind' && result.conflictingActions.length > 0) {
                const conflictingNames = result.conflictingActions
                    .map(action => `「${getActionName(action)}」`)
                    .join('、');
                setShortcutConflictNotice(
                    `已解除${conflictingNames}的快捷键，避免与「${getActionName(recordingAction)}」冲突`
                );
            } else {
                setShortcutConflictNotice('');
            }

            result.updates.forEach(update => {
                onUpdateShortcut(update.action, update.shortcut);
            });
            setRecordingAction(null);
        };

        window.addEventListener('keydown', handleKeyDown, { capture: true });
        return () => window.removeEventListener('keydown', handleKeyDown, { capture: true });
    }, [isOpen, activeTab, recordingAction, onUpdateShortcut, shortcuts]);

    if (!isOpen) return null;

    const handleToggleAutoExpandScheme = () => {
        const nextSettings = {
            ...localGeneralSettings,
            autoExpandSchemeInDeepFormat: !localGeneralSettings.autoExpandSchemeInDeepFormat,
        };
        setLocalGeneralSettings(nextSettings);
        onSaveGeneralSettings(nextSettings);
    };

    const aiTestButtonLabel = isTestingAI ? 'AI 连接测试中，请稍候' : '测试连接';
    const aiTestButtonTitle = isTestingAI ? 'AI 连接测试中，请稍候' : '测试当前 AI 配置是否可用';

    const handleImportBackupFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        event.target.value = '';
        if (file) {
            onImportSettingsBackup(file);
        }
    };

    const renderKey = (label: string) => (
        <kbd className="px-2 py-1 bg-editor-border border border-editor-active border-b-[3px] rounded text-xs font-mono text-gray-200 min-w-[24px] text-center inline-block mx-0.5 shadow-sm">
            {label}
        </kbd>
    );

    const formatShortcut = (shortcut: ShortcutKey) => {
        const labels = getShortcutDisplayLabels(shortcut);
        if (labels.length === 0) return <span className="text-gray-500 italic text-xs">未设置</span>;

        return (
            <div className="flex items-center flex-wrap justify-end">
                {labels.map((label, index) => (
                    <React.Fragment key={`${label}-${index}`}>{renderKey(label)}</React.Fragment>
                ))}
            </div>
        );
    };

    const startRecordingShortcut = (action: ShortcutAction) => {
        setShortcutConflictNotice('');
        setRecordingAction(action);
    };

    const selectSettingsTab = (tab: TabType, shouldFocus = false) => {
        setActiveTab(tab);
        if (tab !== 'shortcuts') {
            setRecordingAction(null);
        }

        if (shouldFocus) {
            window.setTimeout(() => {
                tabButtonRefs.current[tab]?.focus();
            }, 0);
        }
    };

    const handleSettingsTabKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
        const currentIndex = SETTINGS_TABS.findIndex(tab => tab.type === activeTab);
        if (currentIndex < 0) return;

        const lastIndex = SETTINGS_TABS.length - 1;
        let nextIndex = currentIndex;

        if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
            nextIndex = currentIndex === lastIndex ? 0 : currentIndex + 1;
        } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
            nextIndex = currentIndex === 0 ? lastIndex : currentIndex - 1;
        } else if (event.key === 'Home') {
            nextIndex = 0;
        } else if (event.key === 'End') {
            nextIndex = lastIndex;
        } else {
            return;
        }

        event.preventDefault();
        const nextTab = SETTINGS_TABS[nextIndex];
        if (nextTab) {
            selectSettingsTab(nextTab.type, true);
        }
    };

    return (
        <NativeDialog
            isOpen={isOpen}
            onRequestClose={() => {
                if (!recordingAction) {
                    onClose();
                }
            }}
            closeOnBackdrop={false}
            aria-labelledby="settings-modal-title"
            className="w-[calc(100%-2rem)] max-w-2xl overflow-visible border-0 bg-transparent p-0 text-left backdrop:bg-black/60 backdrop:backdrop-blur-sm"
        >
            <div
                className="bg-editor-sidebar border border-editor-border rounded-lg shadow-2xl w-full max-w-2xl p-0 overflow-hidden flex flex-col max-h-[80vh]"
            >
                <div className="flex justify-between items-center px-4 py-2 border-b border-editor-border bg-editor-header rounded-t-lg">
                    <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        <span id="settings-modal-title" className="text-sm font-semibold text-gray-200">设置</span>
                    </div>
                    <button
                        type="button"
                        autoFocus
                        aria-label="关闭设置"
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition-colors p-1 rounded hover:bg-editor-hover"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <div
                    role="tablist"
                    aria-label="设置分类"
                    className="flex border-b border-editor-border bg-editor-header"
                >
                    <button
                        ref={(element) => { tabButtonRefs.current.general = element; }}
                        type="button"
                        role="tab"
                        id="settings-tab-general"
                        aria-selected={activeTab === 'general'}
                        aria-controls="settings-panel-general"
                        tabIndex={activeTab === 'general' ? 0 : -1}
                        onClick={() => selectSettingsTab('general')}
                        onKeyDown={handleSettingsTabKeyDown}
                        className={`flex-1 px-6 py-3 text-sm font-medium transition-all ${activeTab === 'general'
                            ? 'text-white border-b-2 border-emerald-500 bg-editor-sidebar'
                            : 'text-gray-400 hover:text-gray-200 hover:bg-editor-hover'
                            }`}
                    >
                        <div className="flex items-center justify-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
                            通用设置
                        </div>
                    </button>
                    <button
                        ref={(element) => { tabButtonRefs.current.ai = element; }}
                        type="button"
                        role="tab"
                        id="settings-tab-ai"
                        aria-selected={activeTab === 'ai'}
                        aria-controls="settings-panel-ai"
                        tabIndex={activeTab === 'ai' ? 0 : -1}
                        onClick={() => selectSettingsTab('ai')}
                        onKeyDown={handleSettingsTabKeyDown}
                        className={`flex-1 px-6 py-3 text-sm font-medium transition-all ${activeTab === 'ai'
                            ? 'text-white border-b-2 border-emerald-500 bg-editor-sidebar'
                            : 'text-gray-400 hover:text-gray-200 hover:bg-editor-hover'
                            }`}
                    >
                        <div className="flex items-center justify-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                            AI 配置
                        </div>
                    </button>
                    <button
                        ref={(element) => { tabButtonRefs.current.shortcuts = element; }}
                        type="button"
                        role="tab"
                        id="settings-tab-shortcuts"
                        aria-selected={activeTab === 'shortcuts'}
                        aria-controls="settings-panel-shortcuts"
                        tabIndex={activeTab === 'shortcuts' ? 0 : -1}
                        onClick={() => selectSettingsTab('shortcuts')}
                        onKeyDown={handleSettingsTabKeyDown}
                        className={`flex-1 px-6 py-3 text-sm font-medium transition-all ${activeTab === 'shortcuts'
                            ? 'text-white border-b-2 border-emerald-500 bg-editor-sidebar'
                            : 'text-gray-400 hover:text-gray-200 hover:bg-editor-hover'
                            }`}
                    >
                        <div className="flex items-center justify-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
                            快捷键
                        </div>
                    </button>
                </div>

                {/* 各设置页保持挂载，切换时保留未保存状态。 */}
                <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                    <div
                        id="settings-panel-shortcuts"
                        role="tabpanel"
                        aria-labelledby="settings-tab-shortcuts"
                        hidden={activeTab !== 'shortcuts'}
                        className="space-y-3"
                    >
                        {shortcutConflictNotice && (
                            <div
                                data-tour="shortcut-conflict-notice"
                                role="status"
                                className="rounded border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200"
                            >
                                {shortcutConflictNotice}
                            </div>
                        )}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {SHORTCUT_ACTIONS.map((action) => (
                                <button
                                    type="button"
                                    key={action}
                                    data-tour={`shortcut-card-${action}`}
                                    onClick={() => startRecordingShortcut(action)}
                                    className={`flex justify-between items-center bg-editor-bg p-4 rounded border transition-all cursor-pointer group text-left ${recordingAction === action
                                        ? 'border-emerald-500 bg-emerald-500/5 ring-1 ring-emerald-500/50'
                                        : 'border-editor-border hover:border-editor-fg-dim hover:bg-editor-hover'
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
                                            <span className="text-xs text-emerald-400 animate-pulse font-medium px-2 py-1 bg-emerald-500/10 rounded">
                                                按下按键...
                                            </span>
                                        ) : (
                                            formatShortcut(shortcuts[action])
                                        )}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div
                        id="settings-panel-ai"
                        role="tabpanel"
                        aria-labelledby="settings-tab-ai"
                        hidden={activeTab !== 'ai'}
                        className="space-y-4"
                    >
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1.5">AI 提供商</label>
                            <select
                                value={localAIConfig.provider}
                                onChange={(e) => handleAIProviderChange(e.target.value as AIProvider)}
                                className="w-full bg-editor-bg border border-editor-border text-gray-200 text-sm rounded focus:border-emerald-500 focus:outline-none block p-2.5"
                            >
                                <option value={AIProvider.GEMINI}>Google Gemini</option>
                                <option value={AIProvider.OPENAI}>OpenAI</option>
                                <option value={AIProvider.QWEN}>阿里云 - 通义千问 (Qwen)</option>
                                <option value={AIProvider.GLM}>智谱AI - ChatGLM</option>
                                <option value={AIProvider.DEEPSEEK}>DeepSeek</option>
                                <option value={AIProvider.CUSTOM}>自定义 (OpenAI Compatible)</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1.5">API Key</label>
                            <input
                                type="password"
                                value={localAIConfig.apiKey}
                                onChange={(e) => updateLocalAIConfig({ apiKey: e.target.value })}
                                placeholder="sk-..."
                                className="w-full bg-editor-bg border border-editor-border text-gray-200 text-sm rounded focus:border-emerald-500 focus:outline-none block p-2.5 placeholder-gray-600"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1.5">模型名称 (Model Name)</label>
                            <input
                                type="text"
                                value={localAIConfig.model}
                                onChange={(e) => updateLocalAIConfig({ model: e.target.value })}
                                placeholder={getAIProviderDefaultModel(localAIConfig.provider)}
                                className="w-full bg-editor-bg border border-editor-border text-gray-200 text-sm rounded focus:border-emerald-500 focus:outline-none block p-2.5 placeholder-gray-600"
                            />
                        </div>

                        {localAIConfig.provider !== AIProvider.GEMINI && (
                            <div>
                                <label className="block text-xs font-medium text-gray-400 mb-1.5">
                                    Base URL {localAIConfig.provider === AIProvider.CUSTOM ? '(Required)' : '(Optional)'}
                                </label>
                                <input
                                    type="text"
                                    value={localAIConfig.baseUrl || ''}
                                    onChange={(e) => updateLocalAIConfig({ baseUrl: e.target.value })}
                                    placeholder={getAIProviderBaseUrlPlaceholder(localAIConfig.provider)}
                                    className="w-full bg-editor-bg border border-editor-border text-gray-200 text-sm rounded focus:border-emerald-500 focus:outline-none block p-2.5 placeholder-gray-600"
                                />
                            </div>
                        )}

                        {localAIConfig.provider !== AIProvider.GEMINI && localAIConfig.provider !== AIProvider.OPENAI && localAIConfig.provider !== AIProvider.CUSTOM && (
                            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded p-3">
                                <p className="text-xs text-emerald-300 leading-relaxed">
                                    {localAIConfig.provider === AIProvider.QWEN && '💡 通义千问支持 OpenAI 兼容接口，请确保使用正确的 API Key 和 Base URL'}
                                    {localAIConfig.provider === AIProvider.GLM && '💡 智谱AI 支持 OpenAI 兼容接口，请使用您的 API Key'}
                                    {localAIConfig.provider === AIProvider.DEEPSEEK && '💡 DeepSeek 使用 OpenAI 兼容接口，支持高性价比的推理服务'}
                                </p>
                            </div>
                        )}

                        {aiTestResult && (
                            <div
                                role={aiTestResult.type === 'success' ? 'status' : 'alert'}
                                className={`text-xs rounded p-3 border ${
                                    aiTestResult.type === 'success'
                                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                                        : 'bg-red-500/10 border-red-500/20 text-red-300'
                                }`}
                            >
                                {aiTestResult.message}
                            </div>
                        )}
                    </div>

                    <div
                        id="settings-panel-general"
                        role="tabpanel"
                        aria-labelledby="settings-tab-general"
                        hidden={activeTab !== 'general'}
                        className="space-y-4"
                    >
                        <div className="bg-editor-bg p-4 rounded border border-editor-border">
                            <div className="flex items-center justify-between">
                                <div className="flex-1 pr-4">
                                    <div id="general-auto-expand-label" className="text-sm font-medium text-gray-200">
                                        嵌套解析时自动展开 CMD/Scheme 字符串
                                    </div>
                                    <div id="general-auto-expand-description" className="text-xs text-gray-500 mt-1">
                                        控制 JSON 字符串内部的 CMD、URL Scheme 和 Base64 JSON 片段是否递归展开；SOURCE 直接粘贴整段 Scheme 时始终会自动展开
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    role="switch"
                                    aria-checked={localGeneralSettings.autoExpandSchemeInDeepFormat}
                                    aria-labelledby="general-auto-expand-label"
                                    aria-describedby="general-auto-expand-description"
                                    onClick={handleToggleAutoExpandScheme}
                                    className={`app-switch relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                                        localGeneralSettings.autoExpandSchemeInDeepFormat ? 'bg-emerald-500' : 'bg-gray-600'
                                    }`}
                                >
                                    <span
                                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                            localGeneralSettings.autoExpandSchemeInDeepFormat ? 'translate-x-5' : 'translate-x-0'
                                        }`}
                                    />
                                </button>
                            </div>
                        </div>
                        <div className="bg-editor-bg p-4 rounded border border-editor-border">
                            <div className="flex items-center justify-between gap-4">
                                <div className="flex-1">
                                    <div className="text-sm font-medium text-gray-200">
                                        浮动面板布局
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">
                                        恢复 JSONPath、Scheme 和模板面板的位置与尺寸
                                    </div>
                                </div>
                                <button
                                    onClick={onResetPanelLayout}
                                    className="px-3 py-1.5 text-xs text-gray-300 border border-editor-border rounded hover:text-white hover:border-emerald-500 hover:bg-editor-hover transition-colors"
                                >
                                    恢复默认布局
                                </button>
                            </div>
                        </div>
                        <div className="bg-editor-bg p-4 rounded border border-editor-border">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                <div className="flex-1">
                                    <div className="text-sm font-medium text-gray-200">
                                        配置备份
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">
                                        导出/导入快捷键、JSONPath 收藏、Schema 收藏、模板和布局；AI Key 不会写入备份文件
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={onExportSettingsBackup}
                                        className="px-3 py-1.5 text-xs text-gray-300 border border-editor-border rounded hover:text-white hover:border-emerald-500 hover:bg-editor-hover transition-colors"
                                    >
                                        导出配置备份
                                    </button>
                                    <button
                                        onClick={() => importBackupInputRef.current?.click()}
                                        className="px-3 py-1.5 text-xs text-gray-300 border border-editor-border rounded hover:text-white hover:border-emerald-500 hover:bg-editor-hover transition-colors"
                                    >
                                        导入配置备份
                                    </button>
                                </div>
                                <input
                                    ref={importBackupInputRef}
                                    type="file"
                                    accept="application/json,.json"
                                    className="hidden"
                                    onChange={handleImportBackupFileChange}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className={`p-4 border-t border-editor-border bg-editor-header flex items-center ${
                    activeTab === 'general' ? 'justify-end' : 'justify-between'
                }`}>
                    {activeTab === 'shortcuts' ? (
                        <>
                            <button
                                onClick={() => {
                                    setShortcutConflictNotice('');
                                    onResetShortcuts();
                                }}
                                className="app-button app-button--ghost flex items-center gap-1.5 px-3 py-2 text-xs hover:text-red-300"
                            >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                                恢复默认设置
                            </button>
                            <button
                                onClick={onClose}
                                className="app-button app-button--primary px-6 py-2 text-sm"
                            >
                                完成
                            </button>
                        </>
                    ) : activeTab === 'ai' ? (
                        <>
                            <button
                                onClick={onClose}
                                className="app-button app-button--ghost px-4 py-2 text-sm"
                            >
                                取消
                            </button>
                            <div className="flex items-center gap-2">
                                <button
                                    data-tour="ai-test-connection"
                                    onClick={handleTestAIConnection}
                                    disabled={isTestingAI}
                                    title={aiTestButtonTitle}
                                    aria-label={aiTestButtonLabel}
                                    className="app-button app-button--secondary px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {isTestingAI ? '测试中...' : '测试连接'}
                                </button>
                                <button
                                    onClick={handleSaveAI}
                                    className="app-button app-button--primary px-6 py-2 text-sm"
                                >
                                    保存设置
                                </button>
                            </div>
                        </>
                    ) : (
                        <button
                            onClick={onClose}
                            className="app-button app-button--primary px-6 py-2 text-sm"
                        >
                            完成
                        </button>
                    )}
                </div>
            </div>
            <AppToastHost toasterId={SETTINGS_DIALOG_TOASTER_ID} dismissOnUnmount />
        </NativeDialog>
    );
};
