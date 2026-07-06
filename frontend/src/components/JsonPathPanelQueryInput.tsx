import React from 'react';
import type { JsonPathPanelUiState } from '../utils/jsonPathPanelUiState';

type JsonPathPanelQueryInputUiState = Pick<
    JsonPathPanelUiState,
    'queryInputDescriptionId' | 'favoriteToggleTitle' | 'queryButtonTitle' | 'showCancelledQuery'
>;

interface JsonPathPanelQueryInputProps {
    query: string;
    normalizedQuery: string;
    isCurrentQueryFavorite: boolean;
    isQuerying: boolean;
    isDataPreparing: boolean;
    error: string;
    uiState: JsonPathPanelQueryInputUiState;
    queryButtonDescriptionId: string;
    inputRef: React.Ref<HTMLInputElement>;
    onQueryChange: (query: string) => void;
    onKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => void;
    onToggleFavorite: () => void;
    onRunQuery: () => void;
    onCancelQuery: () => void;
}

export const JsonPathPanelQueryInput: React.FC<JsonPathPanelQueryInputProps> = ({
    query,
    normalizedQuery,
    isCurrentQueryFavorite,
    isQuerying,
    isDataPreparing,
    error,
    uiState,
    queryButtonDescriptionId,
    inputRef,
    onQueryChange,
    onKeyDown,
    onToggleFavorite,
    onRunQuery,
    onCancelQuery,
}) => (
    <div className="mb-3">
        <div className="flex gap-2">
            <input
                ref={inputRef}
                data-tour="jsonpath-input"
                type="text"
                value={query}
                onChange={(event) => onQueryChange(event.target.value)}
                onKeyDown={onKeyDown}
                placeholder="输入 JSONPath 表达式或字段名"
                aria-label="JSONPath 表达式"
                aria-invalid={Boolean(error)}
                aria-describedby={uiState.queryInputDescriptionId}
                className="flex-1 bg-editor-bg text-gray-200 text-sm px-3 py-2 rounded border border-editor-border focus:border-emerald-500 focus:outline-none font-mono"
            />
            <button
                type="button"
                data-tour="jsonpath-favorite-toggle"
                onClick={onToggleFavorite}
                disabled={!normalizedQuery}
                className={`px-2.5 py-2 rounded border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    isCurrentQueryFavorite
                        ? 'bg-amber-500/15 border-amber-400 text-amber-300 hover:bg-amber-500/25'
                        : 'bg-editor-bg border-editor-border text-gray-400 hover:text-amber-300 hover:border-amber-400'
                }`}
                title={uiState.favoriteToggleTitle}
                aria-label={uiState.favoriteToggleTitle}
            >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill={isCurrentQueryFavorite ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m11.48 3.5 2.47 5.02 5.54.8-4.01 3.91.95 5.52-4.95-2.6-4.95 2.6.95-5.52-4.01-3.91 5.54-.8 2.47-5.02Z" />
                </svg>
            </button>
            <button
                type="button"
                data-tour="jsonpath-query-button"
                onClick={onRunQuery}
                disabled={isQuerying || isDataPreparing}
                className="px-4 py-2 bg-emerald-600 text-white text-sm rounded hover:bg-emerald-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                title={uiState.queryButtonTitle}
                aria-describedby={queryButtonDescriptionId}
            >
                {isQuerying ? '查询中...' : '查询'}
            </button>
            <span id={queryButtonDescriptionId} className="sr-only">
                {uiState.queryButtonTitle}
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
        </div>
        {(isQuerying || uiState.showCancelledQuery) && (
            <div
                data-tour="jsonpath-query-status"
                role="status"
                aria-live="polite"
                className="mt-2 text-xs text-gray-500"
            >
                {isQuerying ? '查询中...' : '已取消查询'}
            </div>
        )}
    </div>
);
