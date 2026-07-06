import React from 'react';

interface JsonPathPanelFavoriteToggleButtonProps {
    isFavorite: boolean;
    disabled: boolean;
    title: string;
    onToggle: () => void;
}

const getJsonPathFavoriteToggleClassName = (isFavorite: boolean) => (
    `px-2.5 py-2 rounded border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
        isFavorite
            ? 'bg-amber-500/15 border-amber-400 text-amber-300 hover:bg-amber-500/25'
            : 'bg-editor-bg border-editor-border text-gray-400 hover:text-amber-300 hover:border-amber-400'
    }`
);

export const JsonPathPanelFavoriteToggleButton: React.FC<JsonPathPanelFavoriteToggleButtonProps> = ({
    isFavorite,
    disabled,
    title,
    onToggle,
}) => (
    <button
        type="button"
        data-tour="jsonpath-favorite-toggle"
        onClick={onToggle}
        disabled={disabled}
        className={getJsonPathFavoriteToggleClassName(isFavorite)}
        title={title}
        aria-label={title}
    >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill={isFavorite ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m11.48 3.5 2.47 5.02 5.54.8-4.01 3.91.95 5.52-4.95-2.6-4.95 2.6.95-5.52-4.01-3.91 5.54-.8 2.47-5.02Z" />
        </svg>
    </button>
);
