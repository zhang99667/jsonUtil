import React from 'react';

interface ActionPanelHeaderProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const ActionPanelHeader: React.FC<ActionPanelHeaderProps> = ({
  isCollapsed,
  onToggleCollapse,
}) => (
  <div className={`px-2 mb-6 mt-1 pb-4 border-b border-editor-border flex items-center ${isCollapsed ? 'justify-center flex-col gap-4' : 'justify-between'}`}>
    <h1 className="m-0 text-sm font-bold text-gray-200 tracking-wide">
      <a className="flex items-center gap-2 rounded-md transition-colors leading-tight hover:text-blue-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-editor-bg" href="/guides/" title="查看 JSONUtils 使用指南">
        <span className="p-1.5 bg-blue-500/10 rounded-lg text-blue-400">
          <svg aria-hidden="true" className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
        </span>
        {isCollapsed ? (
          <span className="sr-only">JSONUtils 使用指南</span>
        ) : (
          <span>
            <span className="block">JSONUtils</span>
            <span className="block text-[10px] font-medium tracking-normal text-gray-400">格式化 · 校验 · 修复</span>
          </span>
        )}
      </a>
    </h1>
    <button
      onClick={onToggleCollapse}
      aria-label={isCollapsed ? '展开工具栏' : '折叠工具栏'}
      aria-controls="action-panel-content"
      aria-expanded={!isCollapsed}
      className="text-gray-500 hover:text-gray-300 p-1 rounded hover:bg-editor-border transition-colors"
      title={isCollapsed ? '展开' : '折叠'}
    >
      {isCollapsed ? (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg>
      ) : (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" /></svg>
      )}
    </button>
  </div>
);
