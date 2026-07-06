import React from 'react';
import {
    JsonPathPanelResultToolbarActionList,
    type JsonPathPanelResultToolbarActionListProps,
} from './JsonPathPanelResultToolbarActionList';

interface JsonPathPanelResultToolbarProps extends JsonPathPanelResultToolbarActionListProps {
    currentResultIndex: number;
    resultCount: number;
    isResultLimited: boolean;
    resultLimit: number;
    resultStatusId: string;
}

export const JsonPathPanelResultToolbar: React.FC<JsonPathPanelResultToolbarProps> = ({
    currentResultIndex,
    resultCount,
    isResultLimited,
    resultLimit,
    isQuerying,
    canCopyValues,
    canCopyPathValues,
    copyButtonLabel,
    copyPathValueButtonLabel,
    resultStatusId,
    onCopyValues,
    onCopyPathValues,
    onPrevious,
    onNext,
}) => {
    if (resultCount === 0) return null;

    return (
        <div className="mb-1 p-1 bg-editor-sidebar border border-editor-border rounded flex items-center justify-between">
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
            <JsonPathPanelResultToolbarActionList
                isQuerying={isQuerying}
                canCopyValues={canCopyValues}
                canCopyPathValues={canCopyPathValues}
                copyButtonLabel={copyButtonLabel}
                copyPathValueButtonLabel={copyPathValueButtonLabel}
                onCopyValues={onCopyValues}
                onCopyPathValues={onCopyPathValues}
                onPrevious={onPrevious}
                onNext={onNext}
            />
        </div>
    );
};
