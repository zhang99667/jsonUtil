import React from 'react';

interface JsonTreeCopySearchResultsMenuProps {
  copyResultsMenuRef: React.Ref<HTMLDetailsElement>;
  hasCopyableResults: boolean;
  onCopySearchResultsJson: () => void;
  onCopySearchResultsMarkdown: () => void;
  onCopySearchResultsCsv: () => void;
}

export const JsonTreeCopySearchResultsMenu: React.FC<JsonTreeCopySearchResultsMenuProps> = ({
  copyResultsMenuRef,
  hasCopyableResults,
  onCopySearchResultsJson,
  onCopySearchResultsMarkdown,
  onCopySearchResultsCsv,
}) => (
  hasCopyableResults ? (
    <details ref={copyResultsMenuRef} className="relative shrink-0">
      <summary
        data-tour="structure-nav-copy-search-results-menu"
        className="w-12 list-none rounded border border-editor-border px-2 py-1.5 text-center text-xs text-gray-300 transition-colors hover:bg-editor-hover focus:outline-none focus-visible:ring-1 focus-visible:ring-emerald-400 [&::-webkit-details-marker]:hidden"
        title="复制当前筛选结果"
        aria-label="复制当前筛选结果"
      >
        结果
      </summary>
      <div className="absolute right-0 top-full z-20 mt-1 w-32 rounded border border-editor-border bg-editor-sidebar py-1 text-xs shadow-xl shadow-black/30">
        <button
          type="button"
          data-tour="structure-nav-copy-search-results"
          onClick={onCopySearchResultsJson}
          className="block w-full px-2 py-1.5 text-left text-gray-300 transition-colors hover:bg-editor-hover hover:text-emerald-100"
        >
          JSON 清单
        </button>
        <button
          type="button"
          data-tour="structure-nav-copy-search-results-markdown"
          onClick={onCopySearchResultsMarkdown}
          className="block w-full px-2 py-1.5 text-left text-gray-300 transition-colors hover:bg-editor-hover hover:text-cyan-100"
        >
          Markdown 摘要
        </button>
        <button
          type="button"
          data-tour="structure-nav-copy-search-results-csv"
          onClick={onCopySearchResultsCsv}
          className="block w-full px-2 py-1.5 text-left text-gray-300 transition-colors hover:bg-editor-hover hover:text-amber-100"
        >
          CSV 摘要
        </button>
      </div>
    </details>
  ) : (
    <button
      type="button"
      data-tour="structure-nav-copy-search-results"
      disabled
      className="w-12 rounded border border-editor-border px-2 py-1.5 text-center text-xs text-gray-300 opacity-50"
      title="有搜索或类型筛选结果后可复制"
    >
      结果
    </button>
  )
);
