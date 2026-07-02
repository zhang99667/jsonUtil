import type { HighlightRange } from '../types';
import type { JsonPathQueryItem } from './jsonPathQuery';

export interface JsonPathPanelQueryState {
  error: string;
  queryRanges: HighlightRange[];
  queryValues: unknown[];
  queryItems: JsonPathQueryItem[];
  currentResultIndex: number;
  totalResults: number;
  isResultLimited: boolean;
  resultLimit: number;
  emptyResultQuery: string;
  isQuerying: boolean;
  cancelledQuery: string;
}

interface JsonPathQuerySuccessPayload {
  ranges: HighlightRange[];
  values: unknown[];
  items: JsonPathQueryItem[];
  totalResults: number;
  isLimited: boolean;
  resultLimit: number;
}

export type JsonPathPanelQueryAction =
  | { type: 'reset' }
  | { type: 'prepare' }
  | { type: 'clearCancelled' }
  | { type: 'start' }
  | { type: 'skipped'; error: string; clearResults?: boolean }
  | { type: 'failed'; error: string }
  | { type: 'empty'; query: string }
  | { type: 'success'; payload: JsonPathQuerySuccessPayload }
  | { type: 'cancelled'; query: string }
  | { type: 'focus'; index: number };

export const initialJsonPathPanelQueryState: JsonPathPanelQueryState = {
  error: '',
  queryRanges: [],
  queryValues: [],
  queryItems: [],
  currentResultIndex: 0,
  totalResults: 0,
  isResultLimited: false,
  resultLimit: 0,
  emptyResultQuery: '',
  isQuerying: false,
  cancelledQuery: '',
};

const clearResultState = (state: JsonPathPanelQueryState): JsonPathPanelQueryState => ({
  ...state,
  queryRanges: [],
  queryValues: [],
  queryItems: [],
  currentResultIndex: 0,
  totalResults: 0,
  isResultLimited: false,
  resultLimit: 0,
});

export const jsonPathPanelQueryStateReducer = (
  state: JsonPathPanelQueryState,
  action: JsonPathPanelQueryAction
): JsonPathPanelQueryState => {
  switch (action.type) {
    case 'reset':
      return { ...initialJsonPathPanelQueryState };
    case 'prepare':
      return {
        ...state,
        error: '',
        cancelledQuery: '',
        emptyResultQuery: '',
      };
    case 'clearCancelled':
      return {
        ...state,
        cancelledQuery: '',
      };
    case 'start':
      return clearResultState({
        ...state,
        error: '',
        emptyResultQuery: '',
        isQuerying: true,
        cancelledQuery: '',
      });
    case 'skipped':
      return action.clearResults
        ? clearResultState({
            ...state,
            error: action.error,
            emptyResultQuery: '',
            isQuerying: false,
          })
        : {
            ...state,
            error: action.error,
            isQuerying: false,
          };
    case 'failed':
      return clearResultState({
        ...state,
        error: action.error,
        emptyResultQuery: '',
        isQuerying: false,
      });
    case 'empty':
      return clearResultState({
        ...state,
        error: '',
        emptyResultQuery: action.query,
        isQuerying: false,
        cancelledQuery: '',
      });
    case 'success':
      return {
        ...state,
        error: '',
        queryRanges: action.payload.ranges,
        queryValues: action.payload.values,
        queryItems: action.payload.items,
        currentResultIndex: 0,
        totalResults: action.payload.totalResults,
        isResultLimited: action.payload.isLimited,
        resultLimit: action.payload.resultLimit,
        emptyResultQuery: '',
        isQuerying: false,
        cancelledQuery: '',
      };
    case 'cancelled':
      return clearResultState({
        ...state,
        error: '',
        emptyResultQuery: '',
        isQuerying: false,
        cancelledQuery: action.query,
      });
    case 'focus':
      return {
        ...state,
        currentResultIndex: action.index,
      };
    default:
      return state;
  }
};
