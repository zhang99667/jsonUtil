import React from 'react';
import type { TransformReportRuntimePlaceholder } from '../utils/transformRuntimePlaceholderTypes';

export interface TransformReportPlaceholderRowActionsProps {
  placeholder: TransformReportRuntimePlaceholder;
  onCopyPath: (path: string, successMessage?: string) => void | Promise<void>;
  onCopyOriginalValue: (value: string, successMessage?: string) => void | Promise<void>;
  onLocatePath?: (path: string) => void;
  onOpenSchemeValue?: (value: string) => void;
}

export const TransformReportPlaceholderRowActions: React.FC<TransformReportPlaceholderRowActionsProps> = ({
  placeholder,
  onCopyPath,
  onCopyOriginalValue,
  onLocatePath,
  onOpenSchemeValue,
}) => (
  <>
    <button
      type="button"
      data-tour="transform-report-copy-placeholder-path"
      onClick={() => { void onCopyPath(placeholder.path); }}
      className="text-gray-400 hover:text-cyan-200 bg-editor-bg border border-editor-border px-2 py-0.5 rounded transition-colors"
    >
      复制路径
    </button>
    {onLocatePath && (
      <button
        type="button"
        data-tour="transform-report-locate-placeholder-path"
        onClick={() => onLocatePath(placeholder.path)}
        className="text-gray-400 hover:text-emerald-200 bg-editor-bg border border-editor-border px-2 py-0.5 rounded transition-colors"
      >
        定位
      </button>
    )}
    <button
      type="button"
      data-tour="transform-report-copy-placeholder-source-path"
      onClick={() => { void onCopyPath(placeholder.sourcePath, '已复制来源路径'); }}
      className="text-gray-400 hover:text-cyan-200 bg-editor-bg border border-editor-border px-2 py-0.5 rounded transition-colors"
    >
      复制来源
    </button>
    {onLocatePath && (
      <button
        type="button"
        data-tour="transform-report-locate-placeholder-source"
        onClick={() => onLocatePath(placeholder.sourcePath)}
        className="text-gray-400 hover:text-emerald-200 bg-editor-bg border border-editor-border px-2 py-0.5 rounded transition-colors"
      >
        定位来源
      </button>
    )}
    {placeholder.sourceOriginalValue && (
      <button
        type="button"
        data-tour="transform-report-copy-placeholder-source-value"
        onClick={() => { void onCopyOriginalValue(placeholder.sourceOriginalValue || '', '已复制来源值'); }}
        className="text-gray-400 hover:text-cyan-200 bg-editor-bg border border-editor-border px-2 py-0.5 rounded transition-colors"
      >
        复制来源值
      </button>
    )}
    {onOpenSchemeValue && placeholder.sourceOriginalValue && (
      <button
        type="button"
        data-tour="transform-report-open-placeholder-source-scheme"
        onClick={() => onOpenSchemeValue(placeholder.sourceOriginalValue || '')}
        className="text-gray-400 hover:text-violet-200 bg-editor-bg border border-editor-border px-2 py-0.5 rounded transition-colors"
      >
        Scheme 打开来源
      </button>
    )}
  </>
);
