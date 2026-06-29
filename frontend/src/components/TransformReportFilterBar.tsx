import React from 'react';

interface TransformReportFilterBarProps {
  query: string;
  isFilterPending: boolean;
  onQueryChange: (query: string) => void;
}

export const TransformReportFilterBar: React.FC<TransformReportFilterBarProps> = ({
  query,
  isFilterPending,
  onQueryChange,
}) => (
  <div className="flex items-center gap-2">
    <input
      data-tour="transform-report-filter"
      value={query}
      onChange={(event) => onQueryChange(event.target.value)}
      placeholder="筛选路径、类型、原始值、解析结果或占位符..."
      className="flex-1 min-w-0 bg-editor-sidebar text-gray-200 text-xs px-3 py-1.5 rounded border border-editor-border focus:border-cyan-600 focus:outline-none"
    />
    {query && (
      <button
        onClick={() => onQueryChange('')}
        className="shrink-0 text-xs text-gray-500 hover:text-gray-300 transition-colors"
      >
        清空
      </button>
    )}
    {isFilterPending && (
      <span className="shrink-0 text-xs text-cyan-400">
        更新中...
      </span>
    )}
  </div>
);
