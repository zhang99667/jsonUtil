import {
  getJsonPathPanelFavoriteToggleTitle,
  getJsonPathPanelInputDescriptionId,
  getJsonPathPanelQueryButtonTitle,
  type JsonPathPanelInputDescriptionIdInput,
  type JsonPathPanelQueryButtonTitleInput,
} from './jsonPathPanelUiTitles';

export interface JsonPathPanelUiStateInput
  extends JsonPathPanelInputDescriptionIdInput, JsonPathPanelQueryButtonTitleInput {
  isCurrentQueryFavorite: boolean;
  isResultLimited: boolean;
  emptyResultQuery: string;
  cancelledQuery: string;
  queryItemsCount: number;
  previewItemsCount: number;
}

export interface JsonPathPanelUiState {
  hiddenResultCount: number;
  copyButtonLabel: string;
  copyPathValueButtonLabel: string;
  showEmptyResult: boolean;
  showCancelledQuery: boolean;
  queryInputDescriptionId?: string;
  favoriteToggleTitle: string;
  queryButtonTitle: string;
}

export const buildJsonPathPanelUiState = ({
  normalizedQuery,
  isCurrentQueryFavorite,
  isResultLimited,
  emptyResultQuery,
  cancelledQuery,
  error,
  isQuerying,
  totalResults,
  navigableResultCount,
  isDataPreparing,
  hasJsonData,
  queryItemsCount,
  previewItemsCount,
  errorMessageId,
  resultStatusId,
}: JsonPathPanelUiStateInput): JsonPathPanelUiState => ({
  hiddenResultCount: Math.max(queryItemsCount - previewItemsCount, 0),
  copyButtonLabel: isResultLimited ? '复制已返回结果' : '复制全部结果',
  copyPathValueButtonLabel: isResultLimited ? '复制已返回路径和值' : '复制路径和值',
  showEmptyResult: Boolean(emptyResultQuery) && !error && !isQuerying && totalResults === 0,
  showCancelledQuery: Boolean(cancelledQuery) && !error && !isQuerying && totalResults === 0,
  queryInputDescriptionId: getJsonPathPanelInputDescriptionId({
    error,
    totalResults,
    navigableResultCount,
    errorMessageId,
    resultStatusId,
  }),
  favoriteToggleTitle: getJsonPathPanelFavoriteToggleTitle(normalizedQuery, isCurrentQueryFavorite),
  queryButtonTitle: getJsonPathPanelQueryButtonTitle({
    normalizedQuery,
    isDataPreparing,
    isQuerying,
    hasJsonData,
  }),
});
