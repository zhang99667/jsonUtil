import React, { useState, useEffect } from 'react';
import { AIConfig, AIProvider } from '../types';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    config: AIConfig;
    onSave: (config: AIConfig) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
    isOpen,
    onClose,
    config,
    onSave
}) => {
    const [localConfig, setLocalConfig] = useState<AIConfig>(config);

    useEffect(() => {
        if (isOpen) {
            setLocalConfig(config);
        }
    }, [isOpen, config]);

    if (!isOpen) return null;

    const handleSave = () => {
        onSave(localConfig);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm animate-fade-in">
            <div className="bg-[#1e1e1e] border border-[#333] rounded-xl shadow-2xl w-full max-w-md p-0 overflow-hidden flex flex-col">
                <div className="flex justify-between items-center p-5 border-b border-[#333] bg-[#252526]">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-violet-500/10 rounded-lg">
                            <svg className="w-5 h-5 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        </div>
                        <h2 className="text-lg font-semibold text-white">AI 设置</h2>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors p-1 hover:bg-[#333] rounded-md">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    {/* Provider Selection */}
                    <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1.5">AI 提供商</label>
                        <select
                            value={localConfig.provider}
                            onChange={(e) => setLocalConfig({ ...localConfig, provider: e.target.value as AIProvider })}
                            className="w-full bg-[#252526] border border-[#333] text-gray-200 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none"
                        >
                            <option value={AIProvider.GEMINI}>Google Gemini</option>
                            <option value={AIProvider.OPENAI}>OpenAI</option>
                            <option value={AIProvider.CUSTOM}>Custom (OpenAI Compatible)</option>
                        </select>
                    </div>

                    {/* API Key */}
                    <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1.5">API Key</label>
                        <input
                            type="password"
                            value={localConfig.apiKey}
                            onChange={(e) => setLocalConfig({ ...localConfig, apiKey: e.target.value })}
                            placeholder="sk-..."
                            className="w-full bg-[#252526] border border-[#333] text-gray-200 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none placeholder-gray-600"
                        />
                    </div>

                    {/* Model Name */}
                    <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1.5">模型名称 (Model Name)</label>
                        <input
                            type="text"
                            value={localConfig.model}
                            onChange={(e) => setLocalConfig({ ...localConfig, model: e.target.value })}
                            placeholder={localConfig.provider === AIProvider.GEMINI ? "gemini-2.0-flash" : "gpt-4o-mini"}
                            className="w-full bg-[#252526] border border-[#333] text-gray-200 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none placeholder-gray-600"
                        />
                    </div>

                    {/* Base URL (Conditional) */}
                    {(localConfig.provider === AIProvider.OPENAI || localConfig.provider === AIProvider.CUSTOM) && (
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1.5">Base URL (Optional)</label>
                            <input
                                type="text"
                                value={localConfig.baseUrl || ''}
                                onChange={(e) => setLocalConfig({ ...localConfig, baseUrl: e.target.value })}
                                placeholder="https://api.openai.com/v1"
                                className="w-full bg-[#252526] border border-[#333] text-gray-200 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none placeholder-gray-600"
                            />
                        </div>
                    )}
                </div>

                <div className="p-4 border-t border-[#333] bg-[#252526] flex justify-end items-center gap-3">
                    <button
                        onClick={onClose}
                        className="text-sm text-gray-400 hover:text-white transition-colors px-4 py-2 rounded hover:bg-[#333]"
                    >
                        取消
                    </button>
                    <button
                        onClick={handleSave}
                        className="bg-violet-600 hover:bg-violet-500 text-white px-6 py-2 rounded-md text-sm font-medium transition-colors shadow-lg shadow-violet-900/20"
                    >
                        保存设置
                    </button>
                </div>
            </div>
        </div>
    );
};
