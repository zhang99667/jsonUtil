import React from 'react';

interface JsonPathPanelQueryStatusProps {
    isQuerying: boolean;
    showCancelledQuery: boolean;
}

export const JsonPathPanelQueryStatus: React.FC<JsonPathPanelQueryStatusProps> = ({
    isQuerying,
    showCancelledQuery,
}) => {
    const statusText = isQuerying ? '查询中...' : showCancelledQuery ? '已取消查询' : '';
    if (!statusText) return null;

    return (
        <div
            data-tour="jsonpath-query-status"
            role="status"
            aria-live="polite"
            className="mt-2 text-xs text-gray-500"
        >
            {statusText}
        </div>
    );
};
