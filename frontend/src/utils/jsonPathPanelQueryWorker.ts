import type { HighlightRange } from '../types';
import type { JsonPathQueryItem } from './jsonPathQuery';

export interface JsonPathWorkerRequest {
  id: number;
  jsonData: string;
  query: string;
  options: {
    deepFormat: boolean;
    autoExpandScheme: boolean;
  };
}

export interface JsonPathWorkerResponse {
  id: number;
  ranges: HighlightRange[];
  values: unknown[];
  items: JsonPathQueryItem[];
  totalResults: number;
  isLimited: boolean;
  resultLimit: number;
  error?: string;
}

export interface JsonPathQueryWorker {
  onmessage: ((event: MessageEvent<JsonPathWorkerResponse>) => void) | null;
  onerror: ((event: ErrorEvent) => void) | null;
  postMessage: (message: JsonPathWorkerRequest) => void;
  terminate: () => void;
}

interface JsonPathWorkerRequestInput {
  id: number;
  jsonData: string;
  queryPath: string;
  deepFormat: boolean;
  autoExpandScheme: boolean;
}

export const createJsonPathQueryWorker = (): JsonPathQueryWorker => (
  new Worker(new URL('../workers/jsonPath.worker.ts', import.meta.url), { type: 'module' }) as JsonPathQueryWorker
);

export const buildJsonPathWorkerRequest = ({
  id,
  jsonData,
  queryPath,
  deepFormat,
  autoExpandScheme,
}: JsonPathWorkerRequestInput): JsonPathWorkerRequest => ({
  id,
  jsonData,
  query: queryPath,
  options: {
    deepFormat,
    autoExpandScheme,
  },
});

export const buildJsonPathQuerySuccessPayload = (response: JsonPathWorkerResponse) => ({
  ranges: response.ranges,
  values: response.values,
  items: response.items || [],
  totalResults: response.totalResults,
  isLimited: response.isLimited,
  resultLimit: response.resultLimit,
});
