import React from 'react';

interface JsonTreeSearchHistoryPanelProps {
  searchHistory: string[];
  onFillSearchHistory: (query: string) => void;
  onRemoveSearchHistory: (query: string) => void;
  onClearSearchHistory: () => void;
}

export const JsonTreeSearchHistoryPanel: React.FC<JsonTreeSearchHistoryPanelProps> = ({
  searchHistory,
  onFillSearchHistory,
  onRemoveSearchHistory,
  onClearSearchHistory,
}) => {
  if (searchHistory.length === 0) return null;

  return (
    <div
      data-tour="structure-nav-search-history"
      className="flex shrink-0 items-center gap-2 border-b border-editor-border bg-editor-bg/60 px-3 py-1.5 text-[11px]"
    >
      <span className="shrink-0 text-gray-500">最近</span>
      <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto [&::-webkit-scrollbar]:hidden">
        {searchHistory.map(item => (
          <span
            key={item}
            className="group/history-item inline-flex max-w-[180px] shrink-0 items-center rounded border border-editor-border bg-editor-sidebar text-gray-300 transition-colors hover:border-emerald-500/40 hover:bg-editor-hover"
          >
            <button
              type="button"
              data-tour="structure-nav-search-history-item"
              onClick={() => onFillSearchHistory(item)}
              className="min-w-0 truncate px-2 py-1 font-mono text-[11px] text-gray-300 transition-colors hover:text-emerald-100 focus:outline-none focus-visible:ring-1 focus-visible:ring-emerald-400"
              title={`${item}\n点击填入结构搜索`}
              aria-label={`填入结构搜索历史：${item}`}
            >
              {item}
            </button>
            <button
              type="button"
              onClick={() => onRemoveSearchHistory(item)}
              className="shrink-0 rounded-r px-1 py-1 text-gray-500 opacity-0 transition-colors hover:text-red-300 focus:opacity-100 focus:outline-none focus-visible:ring-1 focus-visible:ring-red-400 group-hover/history-item:opacity-100"
              title={`删除结构搜索历史：${item}`}
              aria-label={`删除结构搜索历史：${item}`}
            >
              ×
            </button>
          </span>
        ))}
      </div>
      <button
        type="button"
        onClick={onClearSearchHistory}
        className="shrink-0 rounded px-1.5 py-1 text-gray-500 transition-colors hover:bg-editor-hover hover:text-gray-300 focus:outline-none focus-visible:ring-1 focus-visible:ring-gray-400"
        title="清空结构搜索历史"
        aria-label="清空结构搜索历史"
      >
        清空
      </button>
    </div>
  );
};
