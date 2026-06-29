import React from 'react';
import type { TransformReportRuntimePlaceholderGroup } from '../utils/transformRuntimePlaceholderTypes';

interface TransformReportPlaceholderGroupCardProps {
  group: TransformReportRuntimePlaceholderGroup;
  onFilter: (query: string) => void;
}

export const TransformReportPlaceholderGroupCard: React.FC<TransformReportPlaceholderGroupCardProps> = ({
  group,
  onFilter,
}) => (
  <div className="rounded border border-violet-700/50 bg-violet-950/30 px-3 py-2 text-xs">
    <div className="flex flex-wrap items-center gap-1.5">
      <button
        type="button"
        data-tour="transform-report-filter-placeholder-group"
        onClick={() => onFilter(group.value)}
        className="font-mono text-violet-100 hover:text-violet-50 underline decoration-violet-500/50 underline-offset-2 transition-colors"
        title="按该占位符筛选报告"
      >
        {group.value}
      </button>
      <span className="rounded bg-editor-bg px-2 py-0.5 text-violet-200">
        {group.count} 处
      </span>
      <span className="rounded bg-editor-bg px-2 py-0.5 text-gray-300">
        {group.sourceCount} 个来源
      </span>
    </div>
    <div className="mt-1 text-gray-300">{group.description}</div>
    <div className="mt-1 flex flex-col gap-1">
      {group.sources.slice(0, 3).map(source => (
        <div
          key={`${group.value}:${source.sourcePath}`}
          className="min-w-0 font-mono text-gray-500 truncate"
          title={source.sourceOriginalPreview || source.sourcePath}
        >
          来源{source.sourceLabel ? ` ${source.sourceLabel}` : ''} ×{source.count}: {source.sourcePath}
        </div>
      ))}
      {group.sources.length > 3 && (
        <div className="text-gray-500">
          还有 {group.sources.length - 3} 个来源
        </div>
      )}
    </div>
  </div>
);
