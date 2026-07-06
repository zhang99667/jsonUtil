import React from 'react';
import type { JsonPathResultPreviewItem } from '../utils/jsonPathPanelPreviewItems';
import { JsonPathPanelResultPreviewRowContent } from './JsonPathPanelResultPreviewRowContent';

type JsonPathPanelResultPreviewFocusItem = Pick<
    JsonPathResultPreviewItem,
    'index' | 'title' | 'focusAriaLabel' | 'displayIndex' | 'sourceLabel' | 'path' | 'text'
>;

interface JsonPathPanelResultPreviewFocusButtonProps {
    item: JsonPathPanelResultPreviewFocusItem;
    onFocusResult: (index: number) => void;
}

export const JsonPathPanelResultPreviewFocusButton: React.FC<JsonPathPanelResultPreviewFocusButtonProps> = ({
    item,
    onFocusResult,
}) => (
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
);
