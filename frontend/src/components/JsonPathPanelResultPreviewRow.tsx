import React from 'react';
import type { JsonPathResultPreviewItem } from '../utils/jsonPathPanelPreviewItems';
import { JsonPathPanelResultPreviewLocateButton } from './JsonPathPanelResultPreviewLocateButton';

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
            title={item.title}
            aria-label={item.focusAriaLabel}
        >
            <div className="flex min-w-0 items-center gap-1.5">
                <span className="shrink-0 text-[10px] text-gray-500">{item.displayIndex}</span>
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
            <JsonPathPanelResultPreviewLocateButton item={item} onLocateStructureResult={onLocateStructureResult} />
        )}
    </div>
);
