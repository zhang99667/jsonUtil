import React from 'react';
import type { JsonPathPanelUiState } from '../utils/jsonPathPanelUiState';
import { JsonPathPanelFavoriteToggleButton } from './JsonPathPanelFavoriteToggleButton';
import { JsonPathPanelQueryActionButtons } from './JsonPathPanelQueryActionButtons';

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
            <JsonPathPanelFavoriteToggleButton
                isFavorite={isCurrentQueryFavorite}
                disabled={!normalizedQuery}
                title={uiState.favoriteToggleTitle}
                onToggle={onToggleFavorite}
            />
            <JsonPathPanelQueryActionButtons
                isQuerying={isQuerying}
                isDataPreparing={isDataPreparing}
                queryButtonTitle={uiState.queryButtonTitle}
                queryButtonDescriptionId={queryButtonDescriptionId}
                onRunQuery={onRunQuery}
                onCancelQuery={onCancelQuery}
            />
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
