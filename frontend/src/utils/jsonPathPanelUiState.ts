import {
  getJsonPathPanelFavoriteToggleTitle,
  getJsonPathPanelInputDescriptionId,
  getJsonPathPanelQueryButtonTitle,
  type JsonPathPanelInputDescriptionIdInput,
  type JsonPathPanelQueryButtonTitleInput,
} from './jsonPathPanelUiTitles';
import {
  buildJsonPathPanelUiResultState,
  type JsonPathPanelUiResultState,
  type JsonPathPanelUiResultStateInput,
} from './jsonPathPanelUiResultState';

export interface JsonPathPanelUiStateInput
  extends JsonPathPanelInputDescriptionIdInput,
    JsonPathPanelQueryButtonTitleInput,
    JsonPathPanelUiResultStateInput {
  isCurrentQueryFavorite: boolean;
}

export interface JsonPathPanelUiState extends JsonPathPanelUiResultState {
  queryInputDescriptionId?: string;
  favoriteToggleTitle: string;
  queryButtonTitle: string;
}

export const buildJsonPathPanelUiState = (input: JsonPathPanelUiStateInput): JsonPathPanelUiState => ({
  ...buildJsonPathPanelUiResultState(input),
  queryInputDescriptionId: getJsonPathPanelInputDescriptionId(input),
  favoriteToggleTitle: getJsonPathPanelFavoriteToggleTitle(
    input.normalizedQuery,
    input.isCurrentQueryFavorite
  ),
  queryButtonTitle: getJsonPathPanelQueryButtonTitle(input),
});
