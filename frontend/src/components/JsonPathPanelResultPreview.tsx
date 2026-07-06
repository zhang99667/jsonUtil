import React from 'react';
import type { JsonPathResultPreviewItem } from '../utils/jsonPathPanelPreviewItems';

interface JsonPathPanelResultPreviewProps {
    previewItems: JsonPathResultPreviewItem[];
    currentResultIndex: number;
    hiddenResultCount: number;
    maxVisibleResultCount: number;
    copiedResultCount: number;
    isResultLimited: boolean;
    resultLimit: number;
    showLocateStructure: boolean;
    onWheel: React.WheelEventHandler<HTMLElement>;
    onFocusResult: (index: number) => void;
    onLocateStructureResult: (index: number) => void;
}

export const JsonPathPanelResultPreview: React.FC<JsonPathPanelResultPreviewProps> = ({
    previewItems,
    currentResultIndex,
    hiddenResultCount,
    maxVisibleResultCount,
    copiedResultCount,
    isResultLimited,
    resultLimit,
    showLocateStructure,
    onWheel,
    onFocusResult,
    onLocateStructureResult,
}) => {
    if (previewItems.length === 0) return null;

    return (
        <div
            data-tour="jsonpath-results"
            onWheel={onWheel}
            className="mb-3 max-h-24 flex-shrink-0 overflow-y-auto overscroll-contain rounded border border-editor-border bg-editor-bg/60 p-1 space-y-1 [&::-webkit-scrollbar]:hidden"
        >
            {previewItems.map(item => (
                <div
                    key={item.index}
                    className={`flex min-w-0 items-center gap-1 rounded border text-xs transition-colors ${
                        item.index === currentResultIndex
                            ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-100'
                            : 'border-transparent bg-editor-sidebar text-gray-300 hover:bg-editor-hover hover:text-gray-100'
                    }`}
                >
                    <button
                        type="button"
                        data-tour="jsonpath-result-preview"
                        onClick={() => onFocusResult(item.index)}
                        className="min-w-0 flex-1 rounded px-2 py-1 text-left focus:outline-none focus-visible:ring-1 focus-visible:ring-emerald-400"
                        title={`${item.sourceLabel ? `${item.sourceLabel} ` : ''}${item.path}\n${item.text}`}
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
            ))}
            {hiddenResultCount > 0 && (
                <div className="px-2 py-1 text-[11px] text-gray-500">
                    仅显示前 {maxVisibleResultCount} 项，复制按钮可导出已返回的 {copiedResultCount} 项
                </div>
            )}
            {isResultLimited && (
                <div className="px-2 py-1 text-[11px] text-amber-300">
                    为保护性能，命中超过 {resultLimit} 项后已提前停止
                </div>
            )}
        </div>
    );
};
