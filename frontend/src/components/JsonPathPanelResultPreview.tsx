import React from 'react';
import type { JsonPathResultPreviewItem } from '../utils/jsonPathPanelPreviewItems';
import { JsonPathPanelResultPreviewFrame } from './JsonPathPanelResultPreviewFrame';
import { JsonPathPanelResultPreviewList } from './JsonPathPanelResultPreviewList';
import { JsonPathPanelResultPreviewMessages } from './JsonPathPanelResultPreviewMessages';

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
        <JsonPathPanelResultPreviewFrame onWheel={onWheel}>
            <JsonPathPanelResultPreviewList
                previewItems={previewItems}
                currentResultIndex={currentResultIndex}
                showLocateStructure={showLocateStructure}
                onFocusResult={onFocusResult}
                onLocateStructureResult={onLocateStructureResult}
            />
            <JsonPathPanelResultPreviewMessages
                hiddenResultCount={hiddenResultCount}
                maxVisibleResultCount={maxVisibleResultCount}
                copiedResultCount={copiedResultCount}
                isResultLimited={isResultLimited}
                resultLimit={resultLimit}
            />
        </JsonPathPanelResultPreviewFrame>
    );
};
