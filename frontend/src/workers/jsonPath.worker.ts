import type { HighlightRange } from '../types';
import { queryJsonPathRanges } from '../utils/jsonPathQuery';

interface JsonPathWorkerRequest {
  id: number;
  jsonData: string;
  query: string;
  options?: {
    deepFormat?: boolean;
    autoExpandScheme?: boolean;
  };
}

interface JsonPathWorkerResponse {
  id: number;
  ranges: HighlightRange[];
  values: unknown[];
  totalResults: number;
  isLimited: boolean;
  resultLimit: number;
  error?: string;
}

self.onmessage = (event: MessageEvent<JsonPathWorkerRequest>) => {
  const { id, jsonData, query, options } = event.data;

  try {
    const result = queryJsonPathRanges(jsonData, query, options);
    const response: JsonPathWorkerResponse = {
      id,
      ranges: result.ranges,
      values: result.values,
      totalResults: result.totalResults,
      isLimited: result.isLimited,
      resultLimit: result.resultLimit,
    };
    self.postMessage(response);
  } catch (error) {
    const response: JsonPathWorkerResponse = {
      id,
      ranges: [],
      values: [],
      totalResults: 0,
      isLimited: false,
      resultLimit: 0,
      error: error instanceof Error ? error.message : String(error),
    };
    self.postMessage(response);
  }
};

export {};
