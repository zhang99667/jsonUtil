import React from 'react';
import {
    buildJsonPathPanelResultToolbarActionItems,
    type JsonPathPanelResultToolbarActionListProps,
} from './JsonPathPanelResultToolbarActionItems';
import { JsonPathPanelResultToolbarButton } from './JsonPathPanelResultToolbarButton';
import { JsonPathPanelResultToolbarIcon } from './JsonPathPanelResultToolbarIcon';

export type { JsonPathPanelResultToolbarActionListProps };

export const JsonPathPanelResultToolbarActionList: React.FC<JsonPathPanelResultToolbarActionListProps> = (props) => (
    <div className="flex items-center gap-1">
        {buildJsonPathPanelResultToolbarActionItems(props).map(({ key, icon, ...buttonProps }) => (
            <JsonPathPanelResultToolbarButton key={key} {...buttonProps}>
                <JsonPathPanelResultToolbarIcon icon={icon} />
            </JsonPathPanelResultToolbarButton>
        ))}
    </div>
);
