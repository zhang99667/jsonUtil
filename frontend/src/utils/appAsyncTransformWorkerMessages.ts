import { TransformMode, type TransformContext } from '../types';
import type { AppAsyncTransformSnapshot } from './appAsyncTransformSnapshot';
import { isRecord as isUnknownRecord } from './storage';
import { isTransformContext } from './transformContextValidation';

export interface AppAsyncTransformWorkerRequest {
  id: number;
  input: string;
  mode: TransformMode;
  options?: {
    autoExpandScheme?: boolean;
  };
}

export interface AppAsyncTransformWorkerResponse {
  id: number;
  output: string;
  context?: TransformContext;
  error?: string;
}

export const isAppAsyncTransformWorkerResponse = (
  value: unknown,
  expectedMode: TransformMode,
): value is AppAsyncTransformWorkerResponse => {
  if (
    !isUnknownRecord(value)
    || typeof value.id !== 'number'
    || !Number.isInteger(value.id)
    || value.id <= 0
    || typeof value.output !== 'string'
    || (value.error !== undefined && typeof value.error !== 'string')
  ) {
    return false;
  }

  if (value.error !== undefined) return value.context === undefined;
  return expectedMode === TransformMode.DEEP_FORMAT
    ? isTransformContext(value.context)
    : value.context === undefined;
};

export const buildAppAsyncTransformWorkerRequest = (
  id: number,
  snapshot: AppAsyncTransformSnapshot,
): AppAsyncTransformWorkerRequest => ({
  id,
  input: snapshot.input,
  mode: snapshot.mode,
  options: { autoExpandScheme: snapshot.autoExpandScheme },
});
