import type { ArrayLocation, SchemeLocation } from './schemeScanner';
import { isRecord as isUnknownRecord } from './storage';

export interface SchemeScanWorkerRequest {
  id: number;
  jsonString: string;
  forcedPaths?: readonly string[];
}

export interface SchemeScanWorkerResponse {
  id: number;
  locations: SchemeLocation[];
  arrayLocations: ArrayLocation[];
  isLimited: boolean;
  limit: number;
  isArrayLimited: boolean;
  arrayLimit: number;
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

const isArrayLocation = (value: unknown): value is ArrayLocation => (
  isUnknownRecord(value) &&
  typeof value.path === 'string' &&
  typeof value.pointer === 'string' &&
  isPositiveInteger(value.line) &&
  isPositiveInteger(value.column) &&
  isPositiveInteger(value.itemCount) &&
  value.itemCount >= 2
);

export const isSchemeScanWorkerResponse = (value: unknown): value is SchemeScanWorkerResponse => {
  if (!isUnknownRecord(value)) return false;
  if (
    !isPositiveInteger(value.id) ||
    !Array.isArray(value.locations) ||
    !value.locations.every(isSchemeLocation) ||
    !Array.isArray(value.arrayLocations) ||
    !value.arrayLocations.every(isArrayLocation) ||
    typeof value.isLimited !== 'boolean' ||
    typeof value.isArrayLimited !== 'boolean' ||
    (value.error !== undefined && typeof value.error !== 'string')
  ) {
    return false;
  }

  if (typeof value.error === 'string') {
    return value.error.trim().length > 0 &&
      value.locations.length === 0 &&
      value.arrayLocations.length === 0 &&
      value.isLimited === false &&
      value.isArrayLimited === false &&
      value.limit === 0 &&
      value.arrayLimit === 0;
  }
  return isPositiveInteger(value.limit) &&
    value.locations.length <= value.limit &&
    isPositiveInteger(value.arrayLimit) &&
    value.arrayLocations.length <= value.arrayLimit;
};
