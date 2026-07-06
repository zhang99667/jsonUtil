import React from 'react';
import {
    JsonPathPanelResultToolbarActionList,
    type JsonPathPanelResultToolbarActionListProps,
} from './JsonPathPanelResultToolbarActionList';
import { JsonPathPanelResultToolbarStatus } from './JsonPathPanelResultToolbarStatus';

interface JsonPathPanelResultToolbarProps extends JsonPathPanelResultToolbarActionListProps {
    currentResultIndex: number;
    resultCount: number;
    isResultLimited: boolean;
    resultLimit: number;
    resultStatusId: string;
}

export const JsonPathPanelResultToolbar: React.FC<JsonPathPanelResultToolbarProps> = ({
    currentResultIndex,
    resultCount,
    isResultLimited,
    resultLimit,
    resultStatusId,
    ...actionListProps
}) => {
    if (resultCount === 0) return null;

    return (
        <div className="mb-1 p-1 bg-editor-sidebar border border-editor-border rounded flex items-center justify-between">
            <JsonPathPanelResultToolbarStatus
                currentResultIndex={currentResultIndex}
                resultCount={resultCount}
                isResultLimited={isResultLimited}
                resultLimit={resultLimit}
                resultStatusId={resultStatusId}
            />
            <JsonPathPanelResultToolbarActionList {...actionListProps} />
        </div>
    );
};
