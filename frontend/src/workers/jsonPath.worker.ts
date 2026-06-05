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
  totalResults: number;
  error?: string;
}

self.onmessage = (event: MessageEvent<JsonPathWorkerRequest>) => {
  const { id, jsonData, query, options } = event.data;

  try {
    const result = queryJsonPathRanges(jsonData, query, options);
    const response: JsonPathWorkerResponse = {
      id,
      ranges: result.ranges,
      totalResults: result.totalResults,
    };
    self.postMessage(response);
  } catch (error) {
    const response: JsonPathWorkerResponse = {
      id,
      ranges: [],
      totalResults: 0,
      error: error instanceof Error ? error.message : String(error),
    };
    self.postMessage(response);
  }
};

export {};
