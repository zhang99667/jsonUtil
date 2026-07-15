import type { SchemeLocation } from './schemeScanner';
import { isRecord as isUnknownRecord } from './storage';

export interface SchemeScanWorkerRequest {
  id: number;
  jsonString: string;
}

export interface SchemeScanWorkerResponse {
  id: number;
  locations: SchemeLocation[];
  isLimited: boolean;
  limit: number;
  error?: string;
}

export interface SchemeScanWorker {
  onmessage: ((event: MessageEvent<unknown>) => void) | null;
  onerror: ((event: ErrorEvent) => void) | null;
  postMessage(message: SchemeScanWorkerRequest): void;
  terminate(): void;
}

export type SchemeScanWorkerFactory = () => SchemeScanWorker;

export const createSchemeScanWorker: SchemeScanWorkerFactory = () => (
  new Worker(new URL('../workers/schemeScan.worker.ts', import.meta.url), { type: 'module' })
);

const isPositiveInteger = (value: unknown): value is number => (
  typeof value === 'number' && Number.isInteger(value) && value > 0
);

const SCHEME_TYPE_FLAGS = {
  url: true,
  'query-string': true,
  'url-encoded': true,
  base64: true,
  jwt: true,
  json: true,
  plain: true,
} satisfies Record<SchemeLocation['schemeType'], true>;

const isSchemeType = (value: unknown): value is SchemeLocation['schemeType'] => (
  typeof value === 'string' && Object.hasOwn(SCHEME_TYPE_FLAGS, value)
);

const isSchemeLocation = (value: unknown): value is SchemeLocation => {
  if (!isUnknownRecord(value)) return false;
  if (
    typeof value.path !== 'string' ||
    typeof value.pointer !== 'string' ||
    typeof value.value !== 'string' ||
    !isSchemeType(value.schemeType) ||
    (value.label !== undefined && typeof value.label !== 'string') ||
    !isPositiveInteger(value.line) ||
    !isPositiveInteger(value.column) ||
    !isPositiveInteger(value.endLine) ||
    !isPositiveInteger(value.endColumn)
  ) {
    return false;
  }

  return value.endLine > value.line || (
    value.endLine === value.line && value.endColumn >= value.column
  );
};

export const isSchemeScanWorkerResponse = (value: unknown): value is SchemeScanWorkerResponse => {
  if (!isUnknownRecord(value)) return false;
  if (
    !isPositiveInteger(value.id) ||
    !Array.isArray(value.locations) ||
    !value.locations.every(isSchemeLocation) ||
    typeof value.isLimited !== 'boolean' ||
    (value.error !== undefined && typeof value.error !== 'string')
  ) {
    return false;
  }

  if (typeof value.error === 'string') {
    return typeof value.limit === 'number' && Number.isInteger(value.limit) && value.limit >= 0;
  }
  return isPositiveInteger(value.limit) && value.locations.length <= value.limit;
};
