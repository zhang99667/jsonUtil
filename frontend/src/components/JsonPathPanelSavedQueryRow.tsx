import React from 'react';

export type JsonPathSavedQueryTone = 'favorite' | 'history';

interface JsonPathPanelSavedQueryRowProps {
    item: string;
    tone: JsonPathSavedQueryTone;
    dataTour: string;
    selectLabel: string;
    removeLabel: string;
    onSelect: () => void;
    onRemove: () => void;
}

const getSavedQueryButtonClassName = (tone: JsonPathSavedQueryTone) => (
    tone === 'favorite'
        ? 'w-full text-left text-xs px-2 py-1.5 bg-editor-bg text-amber-100 rounded hover:bg-editor-hover transition-colors font-mono truncate pr-7 border border-amber-500/20'
        : 'w-full text-left text-xs px-2 py-1.5 bg-editor-bg text-gray-300 rounded hover:bg-editor-hover transition-colors font-mono truncate pr-7'
);

export const JsonPathPanelSavedQueryRow: React.FC<JsonPathPanelSavedQueryRowProps> = ({
    item,
    tone,
    dataTour,
    selectLabel,
    removeLabel,
    onSelect,
    onRemove,
}) => (
    <div className="relative group">
        <button
            type="button"
            data-tour={dataTour}
            onClick={onSelect}
            className={getSavedQueryButtonClassName(tone)}
            title={`${item}\n点击填入并查询`}
            aria-label={selectLabel}
        >
            {item}
        </button>
        <button
            type="button"
            onClick={(event) => {
                event.stopPropagation();
                onRemove();
            }}
            className="absolute right-1 top-1/2 -translate-y-1/2 text-gray-500 hover:text-red-400 p-1 rounded hover:bg-editor-active opacity-0 group-hover:opacity-100 focus:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400/70 transition-all"
            title={removeLabel}
            aria-label={removeLabel}
        >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
        </button>
    </div>
);
