import React from 'react';
import {
  TransformReportPlaceholderRowActions,
  type TransformReportPlaceholderRowActionsProps,
} from './TransformReportPlaceholderRowActions';
import { SourceLabelBadge } from './TransformReportPanelAtoms';

export type TransformReportPlaceholderRowProps = TransformReportPlaceholderRowActionsProps;

export const TransformReportPlaceholderRow: React.FC<TransformReportPlaceholderRowProps> = ({
  placeholder,
  ...actionProps
}) => (
  <div className="rounded border border-violet-700/50 bg-violet-900/20 px-3 py-2 text-xs">
    <div className="flex items-center justify-between gap-2">
      <div className="min-w-0 flex items-center gap-1.5">
        <SourceLabelBadge label={placeholder.sourceLabel} />
        <span className="font-mono text-violet-200 truncate" title={placeholder.path}>
          {placeholder.path}
        </span>
      </div>
      <div className="shrink-0 flex flex-wrap items-center justify-end gap-1.5">
        <span className="bg-editor-bg text-gray-300 px-2 py-0.5 rounded">
          {placeholder.value}
        </span>
        <TransformReportPlaceholderRowActions
          placeholder={placeholder}
          {...actionProps}
        />
      </div>
    </div>
    <div className="mt-1 text-gray-300">{placeholder.description}</div>
    <div className="mt-1 font-mono text-gray-500 truncate" title={placeholder.sourcePath}>
      来源: {placeholder.sourcePath}
    </div>
    {placeholder.sourceOriginalPreview && (
      <div
        className="mt-1 font-mono text-gray-500 truncate"
        title={placeholder.sourceOriginalPreview}
      >
        来源原始值: {placeholder.sourceOriginalPreview}
      </div>
    )}
  </div>
);
