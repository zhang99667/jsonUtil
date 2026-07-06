import React from 'react';

interface JsonPathPanelResultToolbarStatusProps {
    currentResultIndex: number;
    resultCount: number;
    isResultLimited: boolean;
    resultLimit: number;
    resultStatusId: string;
}

export const JsonPathPanelResultToolbarStatus: React.FC<JsonPathPanelResultToolbarStatusProps> = ({
    currentResultIndex,
    resultCount,
    isResultLimited,
    resultLimit,
    resultStatusId,
}) => (
    <div
        id={resultStatusId}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="flex items-center gap-2"
    >
        <span className="text-xs text-gray-400">结果:</span>
        <span className="text-sm font-mono text-emerald-400 font-semibold">
            {currentResultIndex + 1} / {resultCount}
        </span>
        {isResultLimited && (
            <span className="text-[11px] text-amber-300">
                命中超过 {resultLimit}，已提前停止
            </span>
        )}
    </div>
);
