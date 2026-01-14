

import React, { useRef, useState, useEffect } from 'react';
import { TransformMode, ActionType } from '../types';
import { useFeatureTour, FeatureId } from '../hooks/useFeatureTour';

interface ActionPanelProps {
  activeMode: TransformMode;
  onModeChange: (mode: TransformMode) => void;
  onAction: (action: ActionType) => void;
  isProcessing: boolean;
  onOpenSettings: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onToggleJsonPath: () => void;
  onToggleSchemeDecode: () => void;
}

export const ActionPanel: React.FC<ActionPanelProps> = ({
  activeMode,
  onModeChange,
  onAction,
  isProcessing,
  onOpenSettings,
  isCollapsed,
  onToggleCollapse,
  onToggleJsonPath,
  onToggleSchemeDecode
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollState, setScrollState] = useState({ scrollTop: 0, scrollHeight: 0, clientHeight: 0 });
  const [showScrollbar, setShowScrollbar] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [startScrollTop, setStartScrollTop] = useState(0);

  // 功能级引导
  const { triggerFeatureFirstUse, refreshTour } = useFeatureTour();

  // 处理模式切换并触发功能引导
  const handleModeChange = (mode: TransformMode) => {
    // 触发相应的功能引导
    if (mode === TransformMode.DEEP_FORMAT) {
      triggerFeatureFirstUse(FeatureId.DEEP_FORMAT);
    } else if (mode === TransformMode.ESCAPE || mode === TransformMode.UNESCAPE) {
      triggerFeatureFirstUse(FeatureId.ESCAPE);
    } else if (mode === TransformMode.UNICODE_TO_CN || mode === TransformMode.CN_TO_UNICODE) {
      triggerFeatureFirstUse(FeatureId.UNICODE_CONVERT);
    }

    // 调用原始的 onModeChange
    onModeChange(mode);
  };

  // 检测是否需要滚动条
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const checkScrollbar = () => {
      const needsScrollbar = container.scrollHeight > container.clientHeight;
      setShowScrollbar(needsScrollbar);
      setScrollState({
        scrollTop: container.scrollTop,
        scrollHeight: container.scrollHeight,
        clientHeight: container.clientHeight
      });
    };

    checkScrollbar();

    const resizeObserver = new ResizeObserver(checkScrollbar);
    resizeObserver.observe(container);

    return () => resizeObserver.disconnect();
  }, [isCollapsed]);

  // 滚动事件处理
  const handleScroll = () => {
    const container = containerRef.current;
    if (!container) return;

    // 实时刷新引导位置，确保高亮区域跟随滚动
    requestAnimationFrame(() => {
      refreshTour();
    });

    setScrollState({
      scrollTop: container.scrollTop,
      scrollHeight: container.scrollHeight,
      clientHeight: container.clientHeight
    });
  };

  // 计算滚动条位置和大小
  const thumbHeight = scrollState.scrollHeight > 0
    ? (scrollState.clientHeight / scrollState.scrollHeight) * 100
    : 0;
  const thumbTop = scrollState.scrollHeight > 0
    ? (scrollState.scrollTop / scrollState.scrollHeight) * 100
    : 0;

  // 滚动条拖动处理
  const handleScrollbarMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartY(e.pageY);
    setStartScrollTop(scrollState.scrollTop);
    e.preventDefault();
  };

  // 监听拖动事件
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return;

      const deltaY = e.pageY - startY;
      const scrollRatio = scrollState.scrollHeight / scrollState.clientHeight;
      const newScrollTop = startScrollTop + deltaY * scrollRatio;

      containerRef.current.scrollTop = newScrollTop;
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
  }, [isDragging, startY, startScrollTop, scrollState.scrollHeight, scrollState.clientHeight]);

  // 自动触发发现式引导 - 已移除 (根据用户反馈，仅在点击时触发或在主引导中介绍)
  // 之前的 IntersectionObserver 逻辑已删除，恢复为被动触发模式


  const renderToolBtn = (mode: TransformMode, label: string, icon: React.ReactNode, colorClass: string, dataTour?: string) => {
    return (
      <button
        data-tour={dataTour}
        onClick={() => handleModeChange(mode)}
        className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-medium rounded-xl transition-all mb-2 group border bg-editor-sidebar border-transparent text-gray-400 hover:bg-editor-hover hover:text-gray-200 hover:border-gray-600 active:scale-95 shadow-sm ${isCollapsed ? 'justify-center px-2' : ''}`}
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
    <div className="h-full bg-editor-bg border-r border-editor-bg relative group/sidebar">
      {/* ... (container and top bar unchanged) ... */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="h-full flex flex-col p-3 overflow-y-auto [&::-webkit-scrollbar]:hidden scrollbar-hide"
      >
        {/* 侧边栏顶部栏 */}
        <div className={`px-2 mb-6 mt-1 pb-4 border-b border-editor-border flex items-center ${isCollapsed ? 'justify-center flex-col gap-4' : 'justify-between'}`}>
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
            className="text-gray-500 hover:text-gray-300 p-1 rounded hover:bg-editor-border transition-colors"
            title={isCollapsed ? "展开" : "折叠"}
          >
            {isCollapsed ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" /></svg>
            )}
          </button>
        </div>

        {/* 工具组：视图与格式化 */}
        {!isCollapsed && (
          <div className="px-2 text-[10px] font-bold text-editor-fg-dim uppercase tracking-wider mb-2 mt-2">
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

          {renderToolBtn(TransformMode.DEEP_FORMAT, '嵌套解析', (
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
          ), 'text-purple-400', 'deep-format-btn')}

          {renderToolBtn(TransformMode.MINIFY, '压缩 / 去空格', (
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          ), 'text-cyan-400')}
        </div>

        {/* 工具组：转义操作 */}
        {!isCollapsed && (
          <div className="px-2 text-[10px] font-bold text-editor-fg-dim uppercase tracking-wider mb-2">
            转义处理
          </div>
        )}
        <div className="mb-4">
          {renderToolBtn(TransformMode.ESCAPE, '转义', (
            <span className="font-mono font-bold text-sm">\n</span>
          ), 'text-amber-400', 'escape-btn')}

          {renderToolBtn(TransformMode.UNESCAPE, '反转义', (
            <span className="font-mono font-bold text-sm">"</span>
          ), 'text-yellow-400')}
        </div>

        {/* 工具组：编码转换 */}
        {!isCollapsed && (
          <div className="px-2 text-[10px] font-bold text-editor-fg-dim uppercase tracking-wider mb-2">
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

        {/* 工具组：查询与解析工具 */}
        {!isCollapsed && (
          <div className="px-2 text-[10px] font-bold text-editor-fg-dim uppercase tracking-wider mb-2">
            查询 / 解析
          </div>
        )}
        <div className="mb-4">
          <button
            data-tour="jsonpath-button"
            onClick={onToggleJsonPath}
            className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-medium rounded-xl transition-all mb-2 group border bg-editor-sidebar border-transparent text-gray-400 hover:bg-editor-hover hover:text-gray-200 hover:border-gray-600 active:scale-95 shadow-sm ${isCollapsed ? 'justify-center px-2' : ''}`}
            title={isCollapsed ? "JSONPath 查询" : undefined}
          >
            <div className="transition-colors text-gray-500 group-hover:text-emerald-400">
              <svg className="w-5 h-5 flex-shrink-0 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            {!isCollapsed && <span>JSONPath 查询</span>}
          </button>
          
          <button
            onClick={onToggleSchemeDecode}
            className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-medium rounded-xl transition-all mb-2 group border bg-editor-sidebar border-transparent text-gray-400 hover:bg-editor-hover hover:text-gray-200 hover:border-gray-600 active:scale-95 shadow-sm ${isCollapsed ? 'justify-center px-2' : ''}`}
            title={isCollapsed ? "Scheme 解析" : undefined}
          >
            <div className="transition-colors text-gray-500 group-hover:text-emerald-400">
              <svg className="w-5 h-5 flex-shrink-0 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </div>
            {!isCollapsed && <span>Scheme 解析</span>}
          </button>
        </div>

        {/* 文件管理 */}
        <div data-tour="file-operations" className="pt-4 mt-2 border-t border-editor-border">
          <button
            onClick={() => onAction(ActionType.OPEN)}
            className={`w-full bg-editor-sidebar hover:bg-editor-hover border border-editor-border text-gray-300 text-xs font-medium px-4 py-3 rounded-xl transition-all flex items-center gap-2 group justify-center active:scale-95 mb-3 ${isCollapsed ? 'px-2' : ''}`}
            title={isCollapsed ? "打开文件" : undefined}
          >
            <svg className="w-5 h-5 flex-shrink-0 text-gray-400 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" /></svg>
            {!isCollapsed && "打开文件"}
          </button>

          <button
            onClick={() => onAction(ActionType.SAVE)}
            className={`w-full bg-editor-sidebar hover:bg-editor-hover border border-editor-border text-gray-300 text-xs font-medium px-4 py-3 rounded-xl transition-all flex items-center gap-2 group justify-center active:scale-95 mb-3 ${isCollapsed ? 'px-2' : ''}`}
            title={isCollapsed ? "保存为 JSON" : undefined}
          >
            <svg className="w-5 h-5 flex-shrink-0 text-gray-400 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
            {!isCollapsed && "保存为 JSON"}
          </button>

          {/* AI 智能修复 */}
          <button
            data-tour="ai-fix"
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

        {/* 设置入口 */}
        <div className="pt-4 mt-auto">
          <button
            data-tour="settings"
            onClick={onOpenSettings}
            className="w-full flex items-center justify-center gap-2 text-gray-500 hover:text-gray-300 transition-colors p-2 rounded-lg hover:bg-editor-sidebar"
            title="设置"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            {!isCollapsed && <span className="text-xs">设置</span>}
          </button>

        </div>
      </div>

      {/* 自定义垂直滚动条 */}
      {showScrollbar && (
        <div className="absolute right-0 top-0 bottom-0 w-[10px] opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-200">
          <div
            className="absolute right-[2px] w-[6px] bg-scrollbar-bg hover:bg-scrollbar-hover rounded-full cursor-pointer"
            style={{
              height: `${thumbHeight}%`,
              top: `${thumbTop}%`
            }}
            onMouseDown={handleScrollbarMouseDown}
          />
        </div>
      )}
    </div>
  );
};
