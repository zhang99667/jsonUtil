import React, { useState, useEffect } from 'react';
import { ShortcutConfig, ShortcutKey, ShortcutAction, AIConfig, AIProvider } from '../types';

interface UnifiedSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    shortcuts: ShortcutConfig;
    onUpdateShortcut: (action: ShortcutAction, key: ShortcutKey) => void;
    onResetShortcuts: () => void;
    aiConfig: AIConfig;
    onSaveAIConfig: (config: AIConfig) => void;
}

const ACTION_LABELS: Record<ShortcutAction, string> = {
    SAVE: '保存 (Save)',
    FORMAT: '格式化 (Format)',
    DEEP_FORMAT: '深度格式化 (Deep Format)',
    MINIFY: '压缩 (Minify)',
    CLOSE_TAB: '关闭标签 (Close Tab)',
    TOGGLE_JSONPATH: '切换查询面板 (Toggle Query Panel)',
};

type TabType = 'shortcuts' | 'ai';

export const UnifiedSettingsModal: React.FC<UnifiedSettingsModalProps> = ({
    isOpen,
    onClose,
    shortcuts,
    onUpdateShortcut,
    onResetShortcuts,
    aiConfig,
    onSaveAIConfig,
}) => {
    const [activeTab, setActiveTab] = useState<TabType>('shortcuts');
    const [recordingAction, setRecordingAction] = useState<ShortcutAction | null>(null);
    const [localAIConfig, setLocalAIConfig] = useState<AIConfig>(aiConfig);

    useEffect(() => {
        if (isOpen) {
            setLocalAIConfig(aiConfig);
            setActiveTab('shortcuts');
        }
    }, [isOpen, aiConfig]);

    useEffect(() => {
        if (!recordingAction) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            e.preventDefault();
            e.stopPropagation();

            // Backspace 键清除快捷键
            if (e.key === 'Backspace' && !e.metaKey && !e.ctrlKey && !e.altKey && !e.shiftKey) {
                const emptyShortcut: ShortcutKey = { key: '', meta: false, ctrl: false, shift: false, alt: false };
                onUpdateShortcut(recordingAction, emptyShortcut);
                setRecordingAction(null);
                return;
            }

            // 忽略单独的修饰键按压
            if (['Meta', 'Control', 'Shift', 'Alt'].includes(e.key)) return;

            const newShortcut: ShortcutKey = {
                key: e.key,
                meta: e.metaKey,
                ctrl: e.ctrlKey,
                shift: e.shiftKey,
                alt: e.altKey,
            };

            // 检测快捷键冲突
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
                // 解除冲突绑定
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

    const handleSaveAI = () => {
        onSaveAIConfig(localAIConfig);
        onClose();
    };

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
                {/* 模态框头部 */}
                <div className="flex justify-between items-center p-5 border-b border-[#333] bg-[#252526]">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-blue-500/10 rounded-lg">
                            <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        </div>
                        <h2 className="text-lg font-semibold text-white">设置</h2>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors p-1 hover:bg-[#333] rounded-md">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                {/* 选项卡切换 */}
                <div className="flex border-b border-[#333] bg-[#252526]">
                    <button
                        onClick={() => setActiveTab('shortcuts')}
                        className={`flex-1 px-6 py-3 text-sm font-medium transition-all ${activeTab === 'shortcuts'
                            ? 'text-white border-b-2 border-blue-500 bg-[#1e1e1e]'
                            : 'text-gray-400 hover:text-gray-200 hover:bg-[#2a2d2e]'
                            }`}
                    >
                        <div className="flex items-center justify-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
                            快捷键
                        </div>
                    </button>
                    <button
                        onClick={() => setActiveTab('ai')}
                        className={`flex-1 px-6 py-3 text-sm font-medium transition-all ${activeTab === 'ai'
                            ? 'text-white border-b-2 border-blue-500 bg-[#1e1e1e]'
                            : 'text-gray-400 hover:text-gray-200 hover:bg-[#2a2d2e]'
                            }`}
                    >
                        <div className="flex items-center justify-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                            AI 配置
                        </div>
                    </button>
                </div>

                {/* 内容区域（保留挂载以维持状态） */}
                <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                    {/* 快捷键设置 */}
                    <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${activeTab === 'shortcuts' ? '' : 'hidden'}`}>
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

                    {/* AI 参数配置 */}
                    <div className={`space-y-4 ${activeTab === 'ai' ? '' : 'hidden'}`}>
                        {/* AI 提供商选择 */}
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1.5">AI 提供商</label>
                            <select
                                value={localAIConfig.provider}
                                onChange={(e) => setLocalAIConfig({ ...localAIConfig, provider: e.target.value as AIProvider })}
                                className="w-full bg-[#252526] border border-[#333] text-gray-200 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none"
                            >
                                <option value={AIProvider.GEMINI}>Google Gemini</option>
                                <option value={AIProvider.OPENAI}>OpenAI</option>
                                <option value={AIProvider.QWEN}>阿里云 - 通义千问 (Qwen)</option>
                                <option value={AIProvider.ERNIE}>百度 - 文心一言 (ERNIE)</option>
                                <option value={AIProvider.GLM}>智谱AI - ChatGLM</option>
                                <option value={AIProvider.DEEPSEEK}>DeepSeek</option>
                                <option value={AIProvider.CUSTOM}>自定义 (OpenAI Compatible)</option>
                            </select>
                        </div>

                        {/* API Key 配置 */}
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1.5">API Key</label>
                            <input
                                type="password"
                                value={localAIConfig.apiKey}
                                onChange={(e) => setLocalAIConfig({ ...localAIConfig, apiKey: e.target.value })}
                                placeholder="sk-..."
                                className="w-full bg-[#252526] border border-[#333] text-gray-200 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none placeholder-gray-600"
                            />
                        </div>

                        {/* 模型名称配置 */}
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1.5">模型名称 (Model Name)</label>
                            <input
                                type="text"
                                value={localAIConfig.model}
                                onChange={(e) => setLocalAIConfig({ ...localAIConfig, model: e.target.value })}
                                placeholder={
                                    localAIConfig.provider === AIProvider.GEMINI ? "gemini-2.0-flash" :
                                        localAIConfig.provider === AIProvider.QWEN ? "qwen-max" :
                                            localAIConfig.provider === AIProvider.ERNIE ? "ernie-4.0-8k" :
                                                localAIConfig.provider === AIProvider.GLM ? "glm-4" :
                                                    localAIConfig.provider === AIProvider.DEEPSEEK ? "deepseek-chat" :
                                                        "gpt-4o-mini"
                                }
                                className="w-full bg-[#252526] border border-[#333] text-gray-200 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none placeholder-gray-600"
                            />
                        </div>

                        {/* Base URL 配置（可选） */}
                        {localAIConfig.provider !== AIProvider.GEMINI && (
                            <div>
                                <label className="block text-xs font-medium text-gray-400 mb-1.5">
                                    Base URL {localAIConfig.provider === AIProvider.CUSTOM ? '(Required)' : '(Optional)'}
                                </label>
                                <input
                                    type="text"
                                    value={localAIConfig.baseUrl || ''}
                                    onChange={(e) => setLocalAIConfig({ ...localAIConfig, baseUrl: e.target.value })}
                                    placeholder={
                                        localAIConfig.provider === AIProvider.OPENAI ? "https://api.openai.com/v1" :
                                            localAIConfig.provider === AIProvider.QWEN ? "https://dashscope.aliyuncs.com/compatible-mode/v1" :
                                                localAIConfig.provider === AIProvider.ERNIE ? "https://aip.baidubce.com/rpc/2.0/ai_custom/v1" :
                                                    localAIConfig.provider === AIProvider.GLM ? "https://open.bigmodel.cn/api/paas/v4" :
                                                        localAIConfig.provider === AIProvider.DEEPSEEK ? "https://api.deepseek.com/v1" :
                                                            "https://your-api-endpoint.com/v1"
                                    }
                                    className="w-full bg-[#252526] border border-[#333] text-gray-200 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none placeholder-gray-600"
                                />
                            </div>
                        )}

                        {/* 提供商配置说明 */}
                        {localAIConfig.provider !== AIProvider.GEMINI && localAIConfig.provider !== AIProvider.OPENAI && localAIConfig.provider !== AIProvider.CUSTOM && (
                            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                                <p className="text-xs text-blue-300 leading-relaxed">
                                    {localAIConfig.provider === AIProvider.QWEN && '💡 通义千问支持 OpenAI 兼容接口，请确保使用正确的 API Key 和 Base URL'}
                                    {localAIConfig.provider === AIProvider.ERNIE && '💡 文心一言需要使用百度智能云的 API Key 和 Secret Key'}
                                    {localAIConfig.provider === AIProvider.GLM && '💡 智谱AI 支持 OpenAI 兼容接口，请使用您的 API Key'}
                                    {localAIConfig.provider === AIProvider.DEEPSEEK && '💡 DeepSeek 使用 OpenAI 兼容接口，支持高性价比的推理服务'}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* 底部操作栏 */}
                <div className="p-4 border-t border-[#333] bg-[#252526] flex justify-between items-center">
                    {activeTab === 'shortcuts' ? (
                        <>
                            <button
                                onClick={onResetShortcuts}
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
                        </>
                    ) : (
                        <>
                            <button
                                onClick={onClose}
                                className="text-sm text-gray-400 hover:text-white transition-colors px-4 py-2 rounded hover:bg-[#333]"
                            >
                                取消
                            </button>
                            <button
                                onClick={handleSaveAI}
                                className="bg-violet-600 hover:bg-violet-500 text-white px-6 py-2 rounded-md text-sm font-medium transition-colors shadow-lg shadow-violet-900/20"
                            >
                                保存设置
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
