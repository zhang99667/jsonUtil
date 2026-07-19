import type { BuildJsonTreeModelOptions, JsonTreeModel } from './jsonTreeModel';

export interface JsonTreeWorkerRequest {
  id: number;
  jsonData: string;
  options?: BuildJsonTreeModelOptions;
}

export interface JsonTreeWorkerResponse {
  id: number;
  model: JsonTreeModel | null;
  error?: string;
}

export interface JsonTreeWorker {
  onmessage: ((event: MessageEvent<unknown>) => void) | null;
  onerror: ((event: ErrorEvent) => void) | null;
  postMessage(message: JsonTreeWorkerRequest): void;
  terminate(): void;
}

export type JsonTreeWorkerFactory = () => JsonTreeWorker;

export const createJsonTreeWorker = (): JsonTreeWorker => (
  new Worker(new URL('../workers/jsonTree.worker.ts', import.meta.url), { type: 'module' })
);
