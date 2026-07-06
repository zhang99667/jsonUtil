export interface JsonPathPanelUiStateInput {
  normalizedQuery: string;
  isCurrentQueryFavorite: boolean;
  isResultLimited: boolean;
  emptyResultQuery: string;
  cancelledQuery: string;
  error: string;
  isQuerying: boolean;
  totalResults: number;
  navigableResultCount: number;
  isDataPreparing: boolean;
  hasJsonData: boolean;
  queryItemsCount: number;
  previewItemsCount: number;
  errorMessageId: string;
  resultStatusId: string;
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
}: JsonPathPanelUiStateInput): JsonPathPanelUiState => {
  const showEmptyResult = Boolean(emptyResultQuery) && !error && !isQuerying && totalResults === 0;
  const showCancelledQuery = Boolean(cancelledQuery) && !error && !isQuerying && totalResults === 0;
  const queryInputDescriptionId = error
    ? errorMessageId
    : totalResults > 0 && navigableResultCount > 0
      ? resultStatusId
      : undefined;
  const favoriteToggleTitle = !normalizedQuery
    ? '请输入 JSONPath 表达式或字段名后可收藏'
    : isCurrentQueryFavorite
      ? '取消收藏当前查询'
      : '收藏当前查询';

  let queryButtonTitle = '执行 JSONPath 查询';
  if (isDataPreparing) {
    queryButtonTitle = '深度格式化仍在处理，请稍后查询';
  } else if (isQuerying) {
    queryButtonTitle = 'JSONPath 查询正在运行，可取消后重新查询';
  } else if (!normalizedQuery) {
    queryButtonTitle = '请输入 JSONPath 表达式或字段名后查询';
  } else if (!hasJsonData) {
    queryButtonTitle = '请先在 SOURCE 输入 JSON 数据';
  }

  return {
    hiddenResultCount: Math.max(queryItemsCount - previewItemsCount, 0),
    copyButtonLabel: isResultLimited ? '复制已返回结果' : '复制全部结果',
    copyPathValueButtonLabel: isResultLimited ? '复制已返回路径和值' : '复制路径和值',
    showEmptyResult,
    showCancelledQuery,
    queryInputDescriptionId,
    favoriteToggleTitle,
    queryButtonTitle,
  };
};
