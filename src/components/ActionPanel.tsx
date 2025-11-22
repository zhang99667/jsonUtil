

import React, { useRef, useState, useEffect } from 'react';
import { TransformMode, ActionType } from '../types';

interface ActionPanelProps {
  activeMode: TransformMode;
  onModeChange: (mode: TransformMode) => void;
  onAction: (action: ActionType) => void;
  isProcessing: boolean;
  onOpenSettings: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onToggleJsonPath: () => void;
}

export const ActionPanel: React.FC<ActionPanelProps> = ({
  activeMode,
  onModeChange,
  onAction,
  isProcessing,
  onOpenSettings,
  isCollapsed,
  onToggleCollapse,
  onToggleJsonPath
}) => {

  // Custom Scrollbar State
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [scrollHeight, setScrollHeight] = useState(0);
  const [clientHeight, setClientHeight] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [startScrollTop, setStartScrollTop] = useState(0);

  // Update scroll dimensions
  const updateScrollDimensions = () => {
    if (scrollContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
      setScrollTop(scrollTop);
      setScrollHeight(scrollHeight);
      setClientHeight(clientHeight);
    }
  };

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver(() => {
      updateScrollDimensions();
    });

    resizeObserver.observe(container);
    // Also observe children to detect content changes
    Array.from(container.children).forEach(child => resizeObserver.observe(child as Element));

    return () => resizeObserver.disconnect();
  }, [isCollapsed]); // Re-attach when collapse state changes

  // Handle scroll event
  const handleScroll = () => {
    updateScrollDimensions();
  };

  // Handle drag start
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartY(e.pageY);
    setStartScrollTop(scrollTop);
    e.preventDefault();
  };

  // Handle drag move and end
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !scrollContainerRef.current) return;

      const delta = e.pageY - startY;
      const scrollRatio = scrollHeight / clientHeight;
      const newScrollTop = startScrollTop + delta * scrollRatio;

      scrollContainerRef.current.scrollTop = newScrollTop;
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, startY, startScrollTop, scrollHeight, clientHeight]);

  // Calculate thumb styles
  const rawThumbHeight = (clientHeight / scrollHeight) * 100;
  const thumbHeight = Math.max(rawThumbHeight, 5); // Min 5% height

  const effectiveThumbHeight = Math.max(rawThumbHeight, 5);
  const thumbTop = (scrollTop / (scrollHeight - clientHeight)) * (100 - effectiveThumbHeight);

  // Show scrollbar if content overflows
  const showScrollbar = scrollHeight > clientHeight + 1;

  const renderToolBtn = (mode: TransformMode, label: string, icon: React.ReactNode, colorClass: string) => {
    return (
      <button
        onClick={() => onModeChange(mode)}
        className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-medium rounded-xl transition-all mb-2 group border bg-[#252526] border-transparent text-gray-400 hover:bg-[#333] hover:text-gray-200 hover:border-[#444] active:scale-95 shadow-sm ${isCollapsed ? 'justify-center px-2' : ''}`}
        title={isCollapsed ? label : undefined}
      >
        <div className={`transition-colors text-gray-500 group-hover:${colorClass.replace('text-', 'text-')}`}>
          <span className={colorClass}>{icon}</span>
        </div>
        {!isCollapsed && <span>{label}</span>}
      </button>
    );
  };

  return (
    <div className={`h-full bg-[#1e1e1e] flex flex-col p-3 border-r border-[#1e1e1e] group/sidebar ${isCollapsed ? 'overflow-y-auto [&::-webkit-scrollbar]:w-[6px] [&::-webkit-scrollbar]:opacity-0 hover:[&::-webkit-scrollbar]:opacity-100 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#424242] [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-[#4f4f4f] [&::-webkit-scrollbar]:transition-opacity [&::-webkit-scrollbar]:duration-200' : 'overflow-y-auto [&::-webkit-scrollbar]:w-[8px] [&::-webkit-scrollbar-track]:bg-[#1e1e1e] [&::-webkit-scrollbar-thumb]:bg-[#424242] [&::-webkit-scrollbar-thumb]:rounded [&::-webkit-scrollbar-thumb]:border-2 [&::-webkit-scrollbar-thumb]:border-[#1e1e1e] hover:[&::-webkit-scrollbar-thumb]:bg-[#4f4f4f]'}`}>
      {/* Sidebar Header */}
      <div className={`px-2 mb-6 mt-1 pb-4 border-b border-[#333] flex items-center ${isCollapsed ? 'justify-center flex-col gap-4' : 'justify-between'}`}>
        {!isCollapsed && (
          <div className="text-sm font-bold text-gray-200 tracking-wide flex items-center gap-2">
            <div className="p-1.5 bg-blue-500/10 rounded-lg text-blue-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
            </div>
            JSON 工具箱
          </div>
        )}
        <button
          onClick={onToggleCollapse}
          className="text-gray-500 hover:text-gray-300 p-1 rounded hover:bg-[#333] transition-colors"
          title={isCollapsed ? "展开" : "折叠"}
        >
          {isCollapsed ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" /></svg>
          )}
        </button>
      </div>

      {/* Group 1: Preview / Output */}
      {!isCollapsed && (
        <div className="px-2 text-[10px] font-bold text-[#555] uppercase tracking-wider mb-2 mt-2">
          预览 / 输出
        </div>
      )}
      <div className="mb-4">
        {renderToolBtn(TransformMode.NONE, '原始视图', (
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
        ), 'text-gray-400')}

        {renderToolBtn(TransformMode.FORMAT, '格式化', (
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" /></svg>
        ), 'text-blue-400')}

        {renderToolBtn(TransformMode.DEEP_FORMAT, '格式化 + 美化 (嵌套解析)', (
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
        ), 'text-purple-400')}

        {renderToolBtn(TransformMode.MINIFY, '压缩 / 去空格', (
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
        ), 'text-cyan-400')}
      </div>

      {/* Group 2: Escape */}
      {!isCollapsed && (
        <div className="px-2 text-[10px] font-bold text-[#555] uppercase tracking-wider mb-2">
          转义处理
        </div>
      )}
      <div className="mb-4">
        {renderToolBtn(TransformMode.ESCAPE, '转义', (
          <span className="font-mono font-bold text-sm">\n</span>
        ), 'text-amber-400')}

        {renderToolBtn(TransformMode.UNESCAPE, '反转义', (
          <span className="font-mono font-bold text-sm">"</span>
        ), 'text-yellow-400')}
      </div>

      {/* Group 3: Encoding */}
      {!isCollapsed && (
        <div className="px-2 text-[10px] font-bold text-[#555] uppercase tracking-wider mb-2">
          编码转换
        </div>
      )}
      <div className="mb-4">
        {renderToolBtn(TransformMode.UNICODE_TO_CN, 'Unicode 转中文', (
          <span className="font-mono font-bold text-sm">\u</span>
        ), 'text-fuchsia-400')}

        {renderToolBtn(TransformMode.CN_TO_UNICODE, '中文 转 Unicode', (
          <span className="font-mono font-bold text-sm">cn</span>
        ), 'text-pink-400')}
      </div>

      <div className="flex-1"></div>

      {/* JSONPath Tool */}
      {!isCollapsed && (
        <div className="px-2 text-[10px] font-bold text-[#555] uppercase tracking-wider mb-2">
          查询工具
        </div>
      )}
      <div className="mb-4">
        <button
          onClick={onToggleJsonPath}
          className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-medium rounded-xl transition-all mb-2 group border bg-[#252526] border-transparent text-gray-400 hover:bg-[#333] hover:text-gray-200 hover:border-[#444] active:scale-95 shadow-sm ${isCollapsed ? 'justify-center px-2' : ''}`}
          title={isCollapsed ? "JSONPath 查询" : undefined}
        >
          <div className="transition-colors text-gray-500 group-hover:text-emerald-400">
            <svg className="w-5 h-5 flex-shrink-0 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          {!isCollapsed && <span>JSONPath 查询</span>}
        </button>
      </div>

      {/* File Operations */}
      <div className="pt-4 mt-2 border-t border-[#333]">
        <button
          onClick={() => onAction(ActionType.OPEN)}
          className={`w-full bg-[#252526] hover:bg-[#333] border border-gray-700 text-gray-300 text-xs font-medium px-4 py-3 rounded-xl transition-all flex items-center gap-2 group justify-center active:scale-95 mb-3 ${isCollapsed ? 'px-2' : ''}`}
          title={isCollapsed ? "打开文件" : undefined}
        >
          <svg className="w-5 h-5 flex-shrink-0 text-gray-400 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" /></svg>
          {!isCollapsed && "打开文件"}
        </button>

        <button
          onClick={() => onAction(ActionType.SAVE)}
          className={`w-full bg-[#252526] hover:bg-[#333] border border-gray-700 text-gray-300 text-xs font-medium px-4 py-3 rounded-xl transition-all flex items-center gap-2 group justify-center active:scale-95 mb-3 ${isCollapsed ? 'px-2' : ''}`}
          title={isCollapsed ? "保存为 JSON" : undefined}
        >
          <svg className="w-5 h-5 flex-shrink-0 text-gray-400 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
          {!isCollapsed && "保存为 JSON"}
        </button>

        {/* AI Fix Button */}
        <button
          onClick={() => onAction(ActionType.AI_FIX)}
          disabled={isProcessing}
          className={`w-full bg-gradient-to-r from-violet-900/20 to-indigo-900/20 hover:from-violet-900/40 hover:to-indigo-900/40 border border-violet-500/20 hover:border-violet-500/40 text-violet-200 text-xs font-medium px-4 py-3 rounded-xl transition-all flex items-center gap-2 group justify-center active:scale-95 shadow-lg shadow-violet-900/5 ${isCollapsed ? 'px-2' : ''}`}
          title={isCollapsed ? "AI 智能修复" : undefined}
        >
          {isProcessing ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-5 w-5 flex-shrink-0 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {!isCollapsed && "修复中..."}
            </>
          ) : (
            <>
              <svg className="w-5 h-5 flex-shrink-0 text-violet-400 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              {!isCollapsed && "AI 智能修复"}
            </>
          )}
        </button>
      </div>

      {/* Settings */}
      <div className="pt-4 mt-auto">
        <button
          onClick={onOpenSettings}
          className="w-full flex items-center justify-center gap-2 text-gray-500 hover:text-gray-300 transition-colors p-2 rounded-lg hover:bg-[#252526]"
          title="设置"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          {!isCollapsed && <span className="text-xs">设置</span>}
        </button>
      </div>
    </div>
  );
};
