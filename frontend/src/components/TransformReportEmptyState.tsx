import React from 'react';

interface TransformReportEmptyStateProps {
  query: string;
  onClearFilter: () => void;
}

export const TransformReportEmptyState: React.FC<TransformReportEmptyStateProps> = ({
  query,
  onClearFilter,
}) => (
  <div
    data-tour="transform-report-empty"
    className="rounded border border-editor-border bg-editor-sidebar p-4 text-center text-xs text-gray-500"
  >
    <div>{query ? '没有匹配的解析记录' : '本次深度格式化没有展开嵌套字符串'}</div>
    {query && (
      <button
        type="button"
        data-tour="transform-report-empty-clear"
        onClick={onClearFilter}
        className="mt-2 rounded border border-editor-border bg-editor-bg px-2.5 py-1 text-gray-300 transition-colors hover:border-cyan-700 hover:text-cyan-100"
      >
        清空筛选
      </button>
    )}
  </div>
);
