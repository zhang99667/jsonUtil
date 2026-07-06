import React from 'react';
import { JsonPathPanelQueryCancelButton } from './JsonPathPanelQueryCancelButton';
import { JsonPathPanelQueryRunButton } from './JsonPathPanelQueryRunButton';

interface JsonPathPanelQueryActionButtonsProps {
    isQuerying: boolean;
    isDataPreparing: boolean;
    queryButtonTitle: string;
    queryButtonDescriptionId: string;
    onRunQuery: () => void;
    onCancelQuery: () => void;
}

export const JsonPathPanelQueryActionButtons: React.FC<JsonPathPanelQueryActionButtonsProps> = ({
    isQuerying,
    isDataPreparing,
    queryButtonTitle,
    queryButtonDescriptionId,
    onRunQuery,
    onCancelQuery,
}) => (
    <>
        <JsonPathPanelQueryRunButton
            isQuerying={isQuerying}
            isDataPreparing={isDataPreparing}
            title={queryButtonTitle}
            descriptionId={queryButtonDescriptionId}
            onRunQuery={onRunQuery}
        />
        {isQuerying && <JsonPathPanelQueryCancelButton onCancelQuery={onCancelQuery} />}
    </>
);
