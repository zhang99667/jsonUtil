import { normalizeJsonPathQueryInput } from './jsonPathInput';

interface JsonPathPanelQueryRunDecisionInput {
  queryInput: string;
  jsonData: string;
  isDataPreparing: boolean;
}

interface JsonPathPanelQueryRunSkip {
  error: string;
  clearResults?: boolean;
  clearHighlight?: boolean;
}

export interface JsonPathPanelQueryRunDecision {
  queryPath: string;
  syncQueryPath: string | null;
  skip: JsonPathPanelQueryRunSkip | null;
}

export const buildJsonPathPanelQueryRunDecision = ({
  queryInput,
  jsonData,
  isDataPreparing,
}: JsonPathPanelQueryRunDecisionInput): JsonPathPanelQueryRunDecision => {
  const normalizedQueryInput = normalizeJsonPathQueryInput(queryInput);
  const queryPath = normalizedQueryInput.query;
  const canSyncFieldShortcut = Boolean(queryPath) &&
    normalizedQueryInput.isFieldNameShortcut &&
    !isDataPreparing;

  if (isDataPreparing) {
    return {
      queryPath,
      syncQueryPath: null,
      skip: { error: '深度格式化仍在处理，请稍后查询' },
    };
  }

  if (!queryPath) {
    return {
      queryPath,
      syncQueryPath: null,
      skip: {
        error: '请输入 JSONPath 表达式或字段名',
        clearResults: true,
        clearHighlight: true,
      },
    };
  }

  if (!jsonData || !jsonData.trim()) {
    return {
      queryPath,
      syncQueryPath: canSyncFieldShortcut ? queryPath : null,
      skip: { error: '请先在左侧输入 JSON 数据' },
    };
  }

  return {
    queryPath,
    syncQueryPath: canSyncFieldShortcut ? queryPath : null,
    skip: null,
  };
};
