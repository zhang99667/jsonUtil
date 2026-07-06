import React from 'react';

interface JsonPathPanelQueryActionButtonsProps {
    isQuerying: boolean;
    isDataPreparing: boolean;
    queryButtonTitle: string;
    queryButtonDescriptionId: string;
    onRunQuery: () => void;
    onCancelQuery: () => void;
}

export const JsonPathPanelQueryActionButtons: React.FC<JsonPathPanelQueryActionButtonsProps> = ({
    isQuerying,
    isDataPreparing,
    queryButtonTitle,
    queryButtonDescriptionId,
    onRunQuery,
    onCancelQuery,
}) => (
    <>
        <button
            type="button"
            data-tour="jsonpath-query-button"
            onClick={onRunQuery}
            disabled={isQuerying || isDataPreparing}
            className="px-4 py-2 bg-emerald-600 text-white text-sm rounded hover:bg-emerald-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            title={queryButtonTitle}
            aria-describedby={queryButtonDescriptionId}
        >
            {isQuerying ? '查询中...' : '查询'}
        </button>
        <span id={queryButtonDescriptionId} className="sr-only">
            {queryButtonTitle}
        </span>
        {isQuerying && (
            <button
                type="button"
                data-tour="jsonpath-cancel-query"
                onClick={onCancelQuery}
                className="px-3 py-2 bg-amber-700/80 text-white text-sm rounded hover:bg-amber-700 transition-colors font-medium"
                title="停止当前 JSONPath 查询"
                aria-label="取消 JSONPath 查询，停止当前正在执行的查询"
            >
                取消
            </button>
        )}
    </>
);
