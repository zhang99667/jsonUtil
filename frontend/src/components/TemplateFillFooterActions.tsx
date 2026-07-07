import React from 'react';

interface TemplateFillFooterActionsProps {
  hasTemplateContent: boolean;
  isTemplateValid: boolean;
  targetError?: string;
  onClear: () => void;
  onFormatTemplate: () => void;
  onApply: () => void;
}

export const TemplateFillFooterActions: React.FC<TemplateFillFooterActionsProps> = ({
  hasTemplateContent,
  isTemplateValid,
  targetError,
  onClear,
  onFormatTemplate,
  onApply,
}) => {
  const clearTemplateTitle = hasTemplateContent ? '清空当前模板内容' : '模板为空，暂无内容可清空';
  const formatTemplateTitle = !hasTemplateContent
    ? '模板为空，暂无内容可格式化'
    : isTemplateValid
      ? '格式化模板 JSON'
      : '请先修正模板 JSON 后再格式化';
  const applyTemplateTitle = targetError ||
    (!hasTemplateContent
      ? '模板为空，暂无内容可应用'
      : isTemplateValid
        ? '应用模板到 SOURCE'
        : '请先修正模板 JSON 后再应用');

  return (
    <>
      <button
        data-tour="template-clear-button"
        onClick={onClear}
        disabled={!hasTemplateContent}
        title={clearTemplateTitle}
        aria-label={`清空模板，${clearTemplateTitle}`}
        className="px-2.5 py-1 text-sm text-gray-400 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        清空模板
      </button>
      <button
        data-tour="template-format-button"
        onClick={onFormatTemplate}
        disabled={!hasTemplateContent || !isTemplateValid}
        title={formatTemplateTitle}
        aria-label={`格式化模板，${formatTemplateTitle}`}
        className="px-2.5 py-1 text-sm bg-editor-active text-gray-200 rounded hover:bg-editor-border transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        格式化模板
      </button>
      <button
        data-tour="template-apply-button"
        onClick={onApply}
        disabled={!hasTemplateContent || !isTemplateValid || Boolean(targetError)}
        title={applyTemplateTitle}
        aria-label={`应用模板到当前 JSON，${applyTemplateTitle}`}
        className="px-3 py-1 text-sm bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        应用模板到当前 JSON
      </button>
    </>
  );
};
