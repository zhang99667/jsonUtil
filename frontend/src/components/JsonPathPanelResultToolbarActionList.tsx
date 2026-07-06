import React from 'react';
import { JsonPathPanelResultToolbarButton } from './JsonPathPanelResultToolbarButton';

export interface JsonPathPanelResultToolbarActionListProps {
    isQuerying: boolean;
    canCopyValues: boolean;
    canCopyPathValues: boolean;
    copyButtonLabel: string;
    copyPathValueButtonLabel: string;
    onCopyValues: () => void;
    onCopyPathValues: () => void;
    onPrevious: () => void;
    onNext: () => void;
}

type JsonPathPanelResultToolbarIconName = 'copyValues' | 'copyPathValues' | 'previous' | 'next';

interface JsonPathPanelResultToolbarActionItem {
    key: string;
    label: string;
    disabled: boolean;
    icon: JsonPathPanelResultToolbarIconName;
    dataTour?: string;
    onClick: () => void;
}

const toolbarActionIconPaths: Record<JsonPathPanelResultToolbarIconName, React.ReactNode> = {
    copyValues: (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
    ),
    copyPathValues: (
        <>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6M8 4h8l4 4v12a2 2 0 01-2 2H8a2 2 0 01-2-2V6a2 2 0 012-2z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 4v4h4" />
        </>
    ),
    previous: (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    ),
    next: (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    ),
};

const renderToolbarActionIcon = (icon: JsonPathPanelResultToolbarIconName) => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        {toolbarActionIconPaths[icon]}
    </svg>
);

export const buildJsonPathPanelResultToolbarActionItems = ({
    isQuerying,
    canCopyValues,
    canCopyPathValues,
    copyButtonLabel,
    copyPathValueButtonLabel,
    onCopyValues,
    onCopyPathValues,
    onPrevious,
    onNext,
}: JsonPathPanelResultToolbarActionListProps): JsonPathPanelResultToolbarActionItem[] => [
    { key: 'copy-values', label: copyButtonLabel, disabled: isQuerying || !canCopyValues, icon: 'copyValues', onClick: onCopyValues },
    { key: 'copy-path-values', label: copyPathValueButtonLabel, disabled: isQuerying || !canCopyPathValues, icon: 'copyPathValues', dataTour: 'jsonpath-copy-path-values', onClick: onCopyPathValues },
    { key: 'previous', label: '上一个结果 (Shift+Enter)', disabled: isQuerying, icon: 'previous', onClick: onPrevious },
    { key: 'next', label: '下一个结果 (Enter)', disabled: isQuerying, icon: 'next', onClick: onNext },
];

export const JsonPathPanelResultToolbarActionList: React.FC<JsonPathPanelResultToolbarActionListProps> = (props) => (
    <div className="flex items-center gap-1">
        {buildJsonPathPanelResultToolbarActionItems(props).map(({ key, icon, ...buttonProps }) => (
            <JsonPathPanelResultToolbarButton key={key} {...buttonProps}>
                {renderToolbarActionIcon(icon)}
            </JsonPathPanelResultToolbarButton>
        ))}
    </div>
);
