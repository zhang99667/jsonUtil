import React from 'react';
import type { JsonPathResultPreviewItem } from '../utils/jsonPathPanelPreviewItems';
import { JsonPathPanelResultPreviewLocateButton } from './JsonPathPanelResultPreviewLocateButton';
import { JsonPathPanelResultPreviewRowContent } from './JsonPathPanelResultPreviewRowContent';

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
            <JsonPathPanelResultPreviewRowContent item={item} />
        </button>
        {showLocateStructure && (
            <JsonPathPanelResultPreviewLocateButton item={item} onLocateStructureResult={onLocateStructureResult} />
        )}
    </div>
);
