import React from 'react';
import { JsonPathPanelResultToolbarButton } from './JsonPathPanelResultToolbarButton';
import {
    JsonPathPanelResultToolbarIcon,
    type JsonPathPanelResultToolbarIconName,
} from './JsonPathPanelResultToolbarIcon';

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

interface JsonPathPanelResultToolbarActionItem {
    key: string;
    label: string;
    disabled: boolean;
    icon: JsonPathPanelResultToolbarIconName;
    dataTour?: string;
    onClick: () => void;
}

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
                <JsonPathPanelResultToolbarIcon icon={icon} />
            </JsonPathPanelResultToolbarButton>
        ))}
    </div>
);
