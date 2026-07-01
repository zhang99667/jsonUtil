import type { TransformMode } from '../types';

export interface AppAsyncTransformSnapshot {
  input: string;
  mode: TransformMode;
  autoExpandScheme: boolean;
}

export const buildAppAsyncTransformSnapshot = (
  input: string,
  mode: TransformMode,
  autoExpandScheme: boolean,
): AppAsyncTransformSnapshot => ({
  input,
  mode,
  autoExpandScheme,
});

export const isSameAppAsyncTransformSnapshot = (
  left: AppAsyncTransformSnapshot,
  right: AppAsyncTransformSnapshot,
): boolean => (
  left.input === right.input &&
  left.mode === right.mode &&
  left.autoExpandScheme === right.autoExpandScheme
);
