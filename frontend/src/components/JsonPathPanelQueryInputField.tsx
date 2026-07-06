import React from 'react';

interface JsonPathPanelQueryInputFieldProps {
    query: string;
    error: string;
    descriptionId: string;
    inputRef: React.Ref<HTMLInputElement>;
    onQueryChange: (query: string) => void;
    onKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => void;
}

export const JsonPathPanelQueryInputField: React.FC<JsonPathPanelQueryInputFieldProps> = ({
    query,
    error,
    descriptionId,
    inputRef,
    onQueryChange,
    onKeyDown,
}) => (
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
        aria-describedby={descriptionId}
        className="flex-1 bg-editor-bg text-gray-200 text-sm px-3 py-2 rounded border border-editor-border focus:border-emerald-500 focus:outline-none font-mono"
    />
);
