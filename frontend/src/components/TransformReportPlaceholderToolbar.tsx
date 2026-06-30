import React from 'react';

export interface TransformReportPlaceholderToolbarProps {
  filteredPlaceholderCount: number;
  visiblePlaceholderCount: number;
  isPlaceholderTruncated: boolean;
  canShowOpenTemplateFill: boolean;
  isPlaceholderFillTemplateDisabled: boolean;
  isCopyPlaceholderReportDisabled: boolean;
  openTemplateFillTitle: string;
  copyTemplateTitle: string;
  copyPlaceholderReportTitle: string;
  onOpenPlaceholderFillTemplate: () => void;
  onCopyPlaceholderFillTemplate: () => void | Promise<void>;
  onCopyPlaceholderReport: () => void | Promise<void>;
}

export const TransformReportPlaceholderToolbar: React.FC<TransformReportPlaceholderToolbarProps> = ({
  filteredPlaceholderCount,
  visiblePlaceholderCount,
  isPlaceholderTruncated,
  canShowOpenTemplateFill,
  isPlaceholderFillTemplateDisabled,
  isCopyPlaceholderReportDisabled,
  openTemplateFillTitle,
  copyTemplateTitle,
  copyPlaceholderReportTitle,
  onOpenPlaceholderFillTemplate,
  onCopyPlaceholderFillTemplate,
  onCopyPlaceholderReport,
}) => (
  <div className="flex flex-wrap items-center justify-between gap-2">
    <div className="text-xs text-gray-500 font-medium">
      运行时占位符 · {filteredPlaceholderCount}
      {isPlaceholderTruncated && (
        <span className="text-amber-300 ml-2">仅显示前 {visiblePlaceholderCount} 条</span>
      )}
    </div>
    <div className="shrink-0 flex flex-wrap items-center justify-end gap-1.5">
      {canShowOpenTemplateFill && (
        <button
          type="button"
          data-tour="transform-report-open-placeholder-fill-template"
          onClick={onOpenPlaceholderFillTemplate}
          disabled={isPlaceholderFillTemplateDisabled}
          className="text-xs text-gray-400 hover:text-violet-200 bg-editor-sidebar border border-editor-border px-2 py-0.5 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title={openTemplateFillTitle}
        >
          填入模板填充
        </button>
      )}
      <button
        type="button"
        data-tour="transform-report-copy-placeholder-fill-template"
        onClick={() => { void onCopyPlaceholderFillTemplate(); }}
        disabled={isPlaceholderFillTemplateDisabled}
        className="text-xs text-gray-400 hover:text-violet-200 bg-editor-sidebar border border-editor-border px-2 py-0.5 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        title={copyTemplateTitle}
      >
        复制回填模板
      </button>
      <button
        type="button"
        data-tour="transform-report-copy-placeholders"
        onClick={() => { void onCopyPlaceholderReport(); }}
        disabled={isCopyPlaceholderReportDisabled}
        className="text-xs text-gray-400 hover:text-violet-200 bg-editor-sidebar border border-editor-border px-2 py-0.5 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        title={copyPlaceholderReportTitle}
      >
        复制占位符
      </button>
    </div>
  </div>
);
