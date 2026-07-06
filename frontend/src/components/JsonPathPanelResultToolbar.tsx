import React from 'react';

interface JsonPathPanelResultToolbarProps {
    currentResultIndex: number;
    resultCount: number;
    isResultLimited: boolean;
    resultLimit: number;
    isQuerying: boolean;
    canCopyValues: boolean;
    canCopyPathValues: boolean;
    copyButtonLabel: string;
    copyPathValueButtonLabel: string;
    resultStatusId: string;
    onCopyValues: () => void;
    onCopyPathValues: () => void;
    onPrevious: () => void;
    onNext: () => void;
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
            <div className="flex items-center gap-1">
                <button
                    onClick={onCopyValues}
                    disabled={isQuerying || !canCopyValues}
                    className="p-1 text-gray-400 hover:text-white hover:bg-editor-hover rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title={copyButtonLabel}
                    aria-label={copyButtonLabel}
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                </button>
                <button
                    data-tour="jsonpath-copy-path-values"
                    onClick={onCopyPathValues}
                    disabled={isQuerying || !canCopyPathValues}
                    className="p-1 text-gray-400 hover:text-white hover:bg-editor-hover rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title={copyPathValueButtonLabel}
                    aria-label={copyPathValueButtonLabel}
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6M8 4h8l4 4v12a2 2 0 01-2 2H8a2 2 0 01-2-2V6a2 2 0 012-2z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 4v4h4" />
                    </svg>
                </button>
                <button
                    type="button"
                    onClick={onPrevious}
                    disabled={isQuerying}
                    className="p-1 text-gray-400 hover:text-white hover:bg-editor-hover rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="上一个结果 (Shift+Enter)"
                    aria-label="上一个结果 (Shift+Enter)"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
                <button
                    type="button"
                    onClick={onNext}
                    disabled={isQuerying}
                    className="p-1 text-gray-400 hover:text-white hover:bg-editor-hover rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="下一个结果 (Enter)"
                    aria-label="下一个结果 (Enter)"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </button>
            </div>
        </div>
    );
};
