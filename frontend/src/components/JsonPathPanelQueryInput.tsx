import React from 'react';
import type { JsonPathPanelUiState } from '../utils/jsonPathPanelUiState';
import {
    JsonPathPanelQueryInputControls,
    type JsonPathPanelQueryInputControlsProps,
} from './JsonPathPanelQueryInputControls';
import { JsonPathPanelQueryStatus } from './JsonPathPanelQueryStatus';

type JsonPathPanelQueryInputUiState = JsonPathPanelQueryInputControlsProps['uiState'] &
    Pick<JsonPathPanelUiState, 'showCancelledQuery'>;

interface JsonPathPanelQueryInputProps extends Omit<JsonPathPanelQueryInputControlsProps, 'uiState'> {
    uiState: JsonPathPanelQueryInputUiState;
}

export const JsonPathPanelQueryInput: React.FC<JsonPathPanelQueryInputProps> = (props) => (
    <div className="mb-3">
        <JsonPathPanelQueryInputControls {...props} />
        <JsonPathPanelQueryStatus isQuerying={props.isQuerying} showCancelledQuery={props.uiState.showCancelledQuery} />
    </div>
);
