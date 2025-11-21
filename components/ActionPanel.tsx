
import React from 'react';
import { TransformMode, ActionType } from '../types';

interface ActionPanelProps {
  activeMode: TransformMode;
  onModeChange: (mode: TransformMode) => void;
  onAction: (action: ActionType) => void;
  isProcessing: boolean;
}

export const ActionPanel: React.FC<ActionPanelProps> = ({
  activeMode,
  onModeChange,
  onAction,
  isProcessing
}) => {

  const renderToolBtn = (mode: TransformMode, label: string, icon: React.ReactNode, colorClass: string) => {
    return (
      <button
        onClick={() => onModeChange(mode)}
        className="w-full flex items-center gap-3 px-4 py-3 text-xs font-medium rounded-xl transition-all mb-2 group border bg-[#252526] border-transparent text-gray-400 hover:bg-[#333] hover:text-gray-200 hover:border-[#444] active:scale-95 shadow-sm"
      >
        <div className={`transition-colors text-gray-500 group-hover:${colorClass.replace('text-', 'text-')}`}>
          <span className={colorClass}>{icon}</span>
        </div>
        <span>{label}</span>
      </button>
    );
  };

  return (
    <div className="h-full bg-[#1e1e1e] flex flex-col overflow-y-auto p-3 border-r border-[#1e1e1e]">
      {/* Sidebar Header */}
      <div className="px-2 mb-6 mt-1 pb-4 border-b border-[#333]">
        <div className="text-sm font-bold text-gray-200 tracking-wide flex items-center gap-2">
          <div className="p-1.5 bg-blue-500/10 rounded-lg text-blue-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
          </div>
          JSON 工具箱
        </div>
      </div>

      {/* Group 1: Preview / Output */}
      <div className="px-2 text-[10px] font-bold text-[#555] uppercase tracking-wider mb-2 mt-2">
        预览 / 输出
      </div>
      <div className="mb-4">
        {renderToolBtn(TransformMode.NONE, '原始视图', (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
        ), 'text-gray-400')}

        {renderToolBtn(TransformMode.FORMAT, '格式化 / 美化', (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" /></svg>
        ), 'text-blue-400')}

        {renderToolBtn(TransformMode.MINIFY, '压缩 / 去空格', (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
        ), 'text-cyan-400')}
      </div>

      {/* Group 2: Escape */}
      <div className="px-2 text-[10px] font-bold text-[#555] uppercase tracking-wider mb-2">
        转义处理
      </div>
      <div className="mb-4">
        {renderToolBtn(TransformMode.ESCAPE, '转义', (
          <span className="font-mono font-bold text-sm">\n</span>
        ), 'text-amber-400')}

        {renderToolBtn(TransformMode.UNESCAPE, '反转义', (
          <span className="font-mono font-bold text-sm">"</span>
        ), 'text-yellow-400')}
      </div>

      {/* Group 3: Encoding */}
      <div className="px-2 text-[10px] font-bold text-[#555] uppercase tracking-wider mb-2">
        编码转换
      </div>
      <div className="mb-4">
        {renderToolBtn(TransformMode.UNICODE_TO_CN, 'Unicode 转中文', (
          <span className="font-mono font-bold text-sm">\u</span>
        ), 'text-fuchsia-400')}

        {renderToolBtn(TransformMode.CN_TO_UNICODE, '中文 转 Unicode', (
          <span className="font-mono font-bold text-sm">cn</span>
        ), 'text-pink-400')}
      </div>

      <div className="flex-1"></div>

      {/* AI Fix Button */}
      <div className="pt-4 mt-2 border-t border-[#333]">
        <button
          onClick={() => onAction(ActionType.AI_FIX)}
          disabled={isProcessing}
          className="w-full bg-gradient-to-r from-violet-900/20 to-indigo-900/20 hover:from-violet-900/40 hover:to-indigo-900/40 border border-violet-500/20 hover:border-violet-500/40 text-violet-200 text-xs font-medium px-4 py-3 rounded-xl transition-all flex items-center gap-2 group justify-center active:scale-95 shadow-lg shadow-violet-900/5"
        >
          <svg className={`w-4 h-4 text-violet-300 ${isProcessing ? 'animate-spin' : 'group-hover:rotate-12 transition-transform'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          {isProcessing ? '正在智能修复...' : 'AI 智能修复'}
        </button>
      </div>
    </div>
  );
};
