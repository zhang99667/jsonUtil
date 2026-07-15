import type { SchemeDecodeResult } from './schemeTypes';
import type { SchemeViewerDecodeMetadata } from './schemeViewerDecodeMetadata';

export interface SchemeDecodeWorkerRequest {
  id: number;
  input: string;
}

export interface SchemeDecodeWorkerResponse {
  id: number;
  result?: SchemeDecodeResult;
  metadata?: SchemeViewerDecodeMetadata;
  error?: string;
}

export interface SchemeDecodeWorker {
  onmessage: ((event: MessageEvent<SchemeDecodeWorkerResponse>) => void) | null;
  onerror: ((event: ErrorEvent) => void) | null;
  postMessage(message: SchemeDecodeWorkerRequest): void;
  terminate(): void;
}

export type SchemeDecodeWorkerFactory = () => SchemeDecodeWorker;

export const createSchemeDecodeWorker: SchemeDecodeWorkerFactory = () => (
  new Worker(new URL('../workers/schemeDecode.worker.ts', import.meta.url), { type: 'module' })
);
