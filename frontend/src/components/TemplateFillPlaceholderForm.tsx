import React from 'react';
import type { PlaceholderTemplateDetail } from '../utils/templateFillPanelModel';

interface TemplateFillPlaceholderFormProps {
  placeholderDetails: PlaceholderTemplateDetail[];
  onReplacementChange: (placeholderValue: string, replacement: string) => void;
  onUseSuggestion: (detail: PlaceholderTemplateDetail) => void;
}

export const TemplateFillPlaceholderForm: React.FC<TemplateFillPlaceholderFormProps> = ({
  placeholderDetails,
  onReplacementChange,
  onUseSuggestion,
}) => (
  <div
    data-tour="template-fill-placeholder-form"
    className="max-h-48 overflow-auto rounded border border-violet-800/40 bg-editor-sidebar text-xs"
  >
    {placeholderDetails.map(detail => {
      const source = detail.sources[0];
      return (
        <div
          key={detail.value}
          data-tour="template-fill-placeholder-row"
          className="grid grid-cols-[minmax(120px,1fr)_minmax(140px,1.2fr)_auto] gap-2 border-b border-editor-border/70 px-2 py-2 last:border-b-0"
        >
          <div className="min-w-0">
            <div className="truncate font-mono text-violet-100" title={detail.value}>
              {detail.value}
            </div>
            {detail.description && (
              <div className="mt-0.5 line-clamp-2 text-[10px] text-gray-500" title={detail.description}>
                {detail.description}
              </div>
            )}
          </div>
          <input
            data-tour="template-fill-placeholder-replacement"
            value={detail.replacement}
            onChange={(event) => onReplacementChange(detail.value, event.target.value)}
            className="min-w-0 rounded border border-editor-border bg-editor-bg px-2 py-1 font-mono text-xs text-gray-100 outline-none focus:border-violet-600"
            placeholder="replacement"
            spellCheck={false}
            title={`填写 ${detail.value} 的 replacement`}
            aria-label={`${detail.value} replacement`}
          />
          <button
            type="button"
            data-tour="template-fill-use-suggestion"
            onClick={() => onUseSuggestion(detail)}
            disabled={!detail.suggestion}
            className="whitespace-nowrap rounded border border-violet-700/60 bg-violet-950/40 px-2 py-1 text-violet-100 transition-colors hover:bg-violet-900/50 disabled:cursor-not-allowed disabled:opacity-50"
            title={detail.suggestion ? `采用候选：${detail.suggestion.sourcePath}` : '暂无候选 replacement'}
            aria-label={`采用 ${detail.value} 候选 replacement`}
          >
            采用候选
          </button>
          {(detail.suggestion || source) && (
            <div className="col-span-3 min-w-0 truncate text-[10px] text-gray-500">
              {detail.suggestion && (
                <span title={detail.suggestion.reason || detail.suggestion.sourcePath}>
                  候选来源: {detail.suggestion.sourceLabel || detail.suggestion.sourcePath}
                </span>
              )}
              {!detail.suggestion && source && (
                <span title={source.sourceOriginalPreview || source.sourcePath}>
                  来源: {source.sourceLabel || source.sourcePath}
                </span>
              )}
            </div>
          )}
        </div>
      );
    })}
  </div>
);
