export interface JsonPathPanelQueryButtonTitleInput {
  normalizedQuery: string;
  isDataPreparing: boolean;
  isQuerying: boolean;
  hasJsonData: boolean;
}

export interface JsonPathPanelInputDescriptionIdInput {
  error: string;
  totalResults: number;
  navigableResultCount: number;
  errorMessageId: string;
  resultStatusId: string;
}

export const getJsonPathPanelFavoriteToggleTitle = (
  normalizedQuery: string,
  isCurrentQueryFavorite: boolean
): string => {
  if (!normalizedQuery) return '请输入 JSONPath 表达式或字段名后可收藏';
  return isCurrentQueryFavorite ? '取消收藏当前查询' : '收藏当前查询';
};

export const getJsonPathPanelQueryButtonTitle = ({
  normalizedQuery,
  isDataPreparing,
  isQuerying,
  hasJsonData,
}: JsonPathPanelQueryButtonTitleInput): string => {
  if (isDataPreparing) return '深度格式化仍在处理，请稍后查询';
  if (isQuerying) return 'JSONPath 查询正在运行，可取消后重新查询';
  if (!normalizedQuery) return '请输入 JSONPath 表达式或字段名后查询';
  if (!hasJsonData) return '请先在 SOURCE 输入 JSON 数据';
  return '执行 JSONPath 查询';
};

export const getJsonPathPanelInputDescriptionId = ({
  error,
  totalResults,
  navigableResultCount,
  errorMessageId,
  resultStatusId,
}: JsonPathPanelInputDescriptionIdInput): string | undefined => {
  if (error) return errorMessageId;
  return totalResults > 0 && navigableResultCount > 0 ? resultStatusId : undefined;
};
