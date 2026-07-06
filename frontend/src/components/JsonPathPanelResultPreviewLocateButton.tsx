import React from 'react';
import type { JsonPathResultPreviewItem } from '../utils/jsonPathPanelPreviewItems';

type JsonPathPanelResultPreviewLocateItem = Pick<
    JsonPathResultPreviewItem,
    'index' | 'locateTitle' | 'locateAriaLabel'
>;

interface JsonPathPanelResultPreviewLocateButtonProps {
    item: JsonPathPanelResultPreviewLocateItem;
    onLocateStructureResult: (index: number) => void;
}

export const JsonPathPanelResultPreviewLocateButton: React.FC<JsonPathPanelResultPreviewLocateButtonProps> = ({
    item,
    onLocateStructureResult,
}) => (
    <button
        type="button"
        data-tour="jsonpath-locate-structure"
        onClick={() => onLocateStructureResult(item.index)}
        className="m-1 shrink-0 rounded p-1 text-cyan-200/70 transition-colors hover:bg-cyan-500/15 hover:text-cyan-100 focus:outline-none focus-visible:ring-1 focus-visible:ring-cyan-300"
        title={item.locateTitle}
        aria-label={item.locateAriaLabel}
    >
        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h6v6H4zM14 4h6v6h-6zM14 14h6v6h-6zM10 9h4M10 17h4M17 10v4" />
        </svg>
    </button>
);
