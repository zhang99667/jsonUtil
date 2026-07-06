import React from 'react';
import type { JsonPathResultPreviewItem } from '../utils/jsonPathPanelPreviewItems';
import { JsonPathPanelResultPreviewFocusButton } from './JsonPathPanelResultPreviewFocusButton';
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
        <JsonPathPanelResultPreviewFocusButton item={item} onFocusResult={onFocusResult} />
        {showLocateStructure && (
            <JsonPathPanelResultPreviewLocateButton item={item} onLocateStructureResult={onLocateStructureResult} />
        )}
    </div>
);
