import type { TransformContext, TransformMode } from '../types';
import type { AppAsyncTransformSnapshot } from './appAsyncTransformSnapshot';

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

export const buildAppAsyncTransformWorkerRequest = (
  id: number,
  snapshot: AppAsyncTransformSnapshot,
): AppAsyncTransformWorkerRequest => ({
  id,
  input: snapshot.input,
  mode: snapshot.mode,
  options: { autoExpandScheme: snapshot.autoExpandScheme },
});
