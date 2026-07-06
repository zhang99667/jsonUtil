import React from 'react';
import type { JsonPathResultPreviewItem } from '../utils/jsonPathPanelPreviewItems';
import { JsonPathPanelResultPreviewRow } from './JsonPathPanelResultPreviewRow';

interface JsonPathPanelResultPreviewListProps {
    previewItems: JsonPathResultPreviewItem[];
    currentResultIndex: number;
    showLocateStructure: boolean;
    onFocusResult: (index: number) => void;
    onLocateStructureResult: (index: number) => void;
}

export const JsonPathPanelResultPreviewList: React.FC<JsonPathPanelResultPreviewListProps> = ({
    previewItems,
    currentResultIndex,
    showLocateStructure,
    onFocusResult,
    onLocateStructureResult,
}) => (
    <>
        {previewItems.map(item => (
            <JsonPathPanelResultPreviewRow
                key={item.index}
                item={item}
                isActive={item.index === currentResultIndex}
                showLocateStructure={showLocateStructure}
                onFocusResult={onFocusResult}
                onLocateStructureResult={onLocateStructureResult}
            />
        ))}
    </>
);
