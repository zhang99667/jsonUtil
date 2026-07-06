import React from 'react';

interface JsonPathPanelQueryRunButtonProps {
    isQuerying: boolean;
    isDataPreparing: boolean;
    title: string;
    descriptionId: string;
    onRunQuery: () => void;
}

export const JsonPathPanelQueryRunButton: React.FC<JsonPathPanelQueryRunButtonProps> = ({
    isQuerying,
    isDataPreparing,
    title,
    descriptionId,
    onRunQuery,
}) => (
    <>
        <button
            type="button"
            data-tour="jsonpath-query-button"
            onClick={() => onRunQuery()}
            disabled={isQuerying || isDataPreparing}
            className="px-4 py-2 bg-emerald-600 text-white text-sm rounded hover:bg-emerald-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            title={title}
            aria-describedby={descriptionId}
        >
            {isQuerying ? '查询中...' : '查询'}
        </button>
        <span id={descriptionId} className="sr-only">
            {title}
        </span>
    </>
);
