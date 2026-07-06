import React from 'react';
import type { JsonPathPanelUiState } from '../utils/jsonPathPanelUiState';
import { JsonPathPanelFavoriteToggleButton } from './JsonPathPanelFavoriteToggleButton';
import { JsonPathPanelQueryActionButtons } from './JsonPathPanelQueryActionButtons';
import { JsonPathPanelQueryInputField } from './JsonPathPanelQueryInputField';

type JsonPathPanelQueryInputControlsUiState = Pick<
    JsonPathPanelUiState,
    'queryInputDescriptionId' | 'favoriteToggleTitle' | 'queryButtonTitle'
>;

export interface JsonPathPanelQueryInputControlsProps {
    query: string;
    normalizedQuery: string;
    isCurrentQueryFavorite: boolean;
    isQuerying: boolean;
    isDataPreparing: boolean;
    error: string;
    uiState: JsonPathPanelQueryInputControlsUiState;
    queryButtonDescriptionId: string;
    inputRef: React.Ref<HTMLInputElement>;
    onQueryChange: (query: string) => void;
    onKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => void;
    onToggleFavorite: () => void;
    onRunQuery: () => void;
    onCancelQuery: () => void;
}

export const JsonPathPanelQueryInputControls: React.FC<JsonPathPanelQueryInputControlsProps> = (props) => (
    <div className="flex gap-2">
        <JsonPathPanelQueryInputField
            query={props.query}
            error={props.error}
            descriptionId={props.uiState.queryInputDescriptionId}
            inputRef={props.inputRef}
            onQueryChange={props.onQueryChange}
            onKeyDown={props.onKeyDown}
        />
        <JsonPathPanelFavoriteToggleButton
            isFavorite={props.isCurrentQueryFavorite}
            disabled={!props.normalizedQuery}
            title={props.uiState.favoriteToggleTitle}
            onToggle={props.onToggleFavorite}
        />
        <JsonPathPanelQueryActionButtons
            isQuerying={props.isQuerying}
            isDataPreparing={props.isDataPreparing}
            queryButtonTitle={props.uiState.queryButtonTitle}
            queryButtonDescriptionId={props.queryButtonDescriptionId}
            onRunQuery={props.onRunQuery}
            onCancelQuery={props.onCancelQuery}
        />
    </div>
);
