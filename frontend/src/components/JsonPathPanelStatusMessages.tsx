import React from 'react';

interface JsonPathPanelStatusMessagesProps {
    error: string;
    errorMessageId: string;
    showEmptyResult: boolean;
    emptyResultQuery: string;
    onClearQuery: () => void;
}

export const JsonPathPanelStatusMessages: React.FC<JsonPathPanelStatusMessagesProps> = ({
    error,
    errorMessageId,
    showEmptyResult,
    emptyResultQuery,
    onClearQuery,
}) => (
    <>
        {error && (
            <div
                id={errorMessageId}
                role="alert"
                className="mb-3 p-3 bg-status-error-bg border border-status-error-border rounded text-sm text-status-error-text flex items-start gap-2"
            >
                <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{error}</span>
            </div>
        )}

        {showEmptyResult && (
            <div
                data-tour="jsonpath-empty"
                role="status"
                aria-live="polite"
                className="mb-3 rounded border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-100"
            >
                <div className="flex items-center justify-between gap-2">
                    <div className="font-medium">未命中任何结果</div>
                    <button
                        type="button"
                        data-tour="jsonpath-empty-clear"
                        onClick={onClearQuery}
                        className="shrink-0 rounded border border-amber-400/40 px-2 py-0.5 text-xs text-amber-100 transition-colors hover:border-amber-300 hover:bg-amber-400/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/60"
                        title="清空当前 JSONPath 查询"
                        aria-label="清空当前 JSONPath 查询"
                    >
                        清空查询
                    </button>
                </div>
                <div className="mt-1 break-all font-mono text-xs text-amber-200/80">
                    {emptyResultQuery}
                </div>
            </div>
        )}
    </>
);
