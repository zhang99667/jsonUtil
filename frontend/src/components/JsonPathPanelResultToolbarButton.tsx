import React from 'react';

interface JsonPathPanelResultToolbarButtonProps {
    label: string;
    disabled: boolean;
    dataTour?: string;
    onClick: () => void;
    children: React.ReactNode;
}

export const JsonPathPanelResultToolbarButton: React.FC<JsonPathPanelResultToolbarButtonProps> = ({
    label,
    disabled,
    dataTour,
    onClick,
    children,
}) => (
    <button
        type="button"
        data-tour={dataTour}
        onClick={onClick}
        disabled={disabled}
        className="p-1 text-gray-400 hover:text-white hover:bg-editor-hover rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        title={label}
        aria-label={label}
    >
        {children}
    </button>
);
