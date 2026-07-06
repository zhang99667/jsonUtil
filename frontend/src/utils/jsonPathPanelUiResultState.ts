export interface JsonPathPanelUiResultStateInput {
  isResultLimited: boolean;
  emptyResultQuery: string;
  cancelledQuery: string;
  error: string;
  isQuerying: boolean;
  totalResults: number;
  queryItemsCount: number;
  previewItemsCount: number;
}

export interface JsonPathPanelUiResultState {
  hiddenResultCount: number;
  copyButtonLabel: string;
  copyPathValueButtonLabel: string;
  showEmptyResult: boolean;
  showCancelledQuery: boolean;
}

const canShowZeroResultStatus = (
  query: string,
  error: string,
  isQuerying: boolean,
  totalResults: number
) => Boolean(query) && !error && !isQuerying && totalResults === 0;

export const buildJsonPathPanelUiResultState = ({
  isResultLimited,
  emptyResultQuery,
  cancelledQuery,
  error,
  isQuerying,
  totalResults,
  queryItemsCount,
  previewItemsCount,
}: JsonPathPanelUiResultStateInput): JsonPathPanelUiResultState => ({
  hiddenResultCount: Math.max(queryItemsCount - previewItemsCount, 0),
  copyButtonLabel: isResultLimited ? '复制已返回结果' : '复制全部结果',
  copyPathValueButtonLabel: isResultLimited ? '复制已返回路径和值' : '复制路径和值',
  showEmptyResult: canShowZeroResultStatus(emptyResultQuery, error, isQuerying, totalResults),
  showCancelledQuery: canShowZeroResultStatus(cancelledQuery, error, isQuerying, totalResults),
});
