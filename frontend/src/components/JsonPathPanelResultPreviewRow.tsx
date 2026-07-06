import React from 'react';
import type { JsonPathResultPreviewItem } from '../utils/jsonPathPanelPreviewItems';

interface JsonPathPanelResultPreviewRowProps {
    item: JsonPathResultPreviewItem;
    isActive: boolean;
    showLocateStructure: boolean;
    onFocusResult: (index: number) => void;
    onLocateStructureResult: (index: number) => void;
}

const getJsonPathResultPreviewRowClassName = (isActive: boolean) => (
    `flex min-w-0 items-center gap-1 rounded border text-xs transition-colors ${
        isActive
            ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-100'
            : 'border-transparent bg-editor-sidebar text-gray-300 hover:bg-editor-hover hover:text-gray-100'
    }`
);

const getJsonPathResultPreviewTitle = (item: JsonPathResultPreviewItem) => (
    `${item.sourceLabel ? `${item.sourceLabel} ` : ''}${item.path}\n${item.text}`
);

export const JsonPathPanelResultPreviewRow: React.FC<JsonPathPanelResultPreviewRowProps> = ({
    item,
    isActive,
    showLocateStructure,
    onFocusResult,
    onLocateStructureResult,
}) => (
    <div className={getJsonPathResultPreviewRowClassName(isActive)}>
        <button
            type="button"
            data-tour="jsonpath-result-preview"
            onClick={() => onFocusResult(item.index)}
            className="min-w-0 flex-1 rounded px-2 py-1 text-left focus:outline-none focus-visible:ring-1 focus-visible:ring-emerald-400"
            title={getJsonPathResultPreviewTitle(item)}
            aria-label={`定位第 ${item.index + 1} 个 JSONPath 结果：${item.path}`}
        >
            <div className="flex min-w-0 items-center gap-1.5">
                <span className="shrink-0 text-[10px] text-gray-500">{item.index + 1}</span>
                {item.sourceLabel && (
                    <span
                        className="max-w-[120px] shrink-0 truncate rounded bg-cyan-900/40 px-1.5 py-0.5 text-[10px] text-cyan-200"
                        title={item.sourceLabel}
                    >
                        {item.sourceLabel}
                    </span>
                )}
                <span className="min-w-0 truncate font-mono text-[10px] text-emerald-300" title={item.path}>
                    {item.path}
                </span>
                <span className="shrink-0 text-gray-600">=</span>
                <span className="min-w-[4rem] max-w-[45%] truncate font-mono text-[10px] text-gray-200" title={item.text}>
                    {item.text}
                </span>
            </div>
        </button>
        {showLocateStructure && (
            <button
                type="button"
                data-tour="jsonpath-locate-structure"
                onClick={() => onLocateStructureResult(item.index)}
                className="m-1 shrink-0 rounded p-1 text-cyan-200/70 transition-colors hover:bg-cyan-500/15 hover:text-cyan-100 focus:outline-none focus-visible:ring-1 focus-visible:ring-cyan-300"
                title={`在结构导航中定位 ${item.path}`}
                aria-label={`在结构导航中定位第 ${item.index + 1} 个 JSONPath 结果：${item.path}`}
            >
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h6v6H4zM14 4h6v6h-6zM14 14h6v6h-6zM10 9h4M10 17h4M17 10v4" />
                </svg>
            </button>
        )}
    </div>
);
