import React from 'react';
import type { JsonPathResultPreviewItem } from '../utils/jsonPathPanelPreviewItems';
import { JsonPathPanelResultPreviewRow } from './JsonPathPanelResultPreviewRow';

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
                <JsonPathPanelResultPreviewRow
                    key={item.index}
                    item={item}
                    isActive={item.index === currentResultIndex}
                    showLocateStructure={showLocateStructure}
                    onFocusResult={onFocusResult}
                    onLocateStructureResult={onLocateStructureResult}
                />
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
