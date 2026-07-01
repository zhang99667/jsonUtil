import {
  TransformMode,
  type TransformContext,
  type TransformResult,
} from '../types';
import { ASYNC_TRANSFORM_PLACEHOLDER } from './appAsyncPolicy';
import {
  isSameAppAsyncTransformSnapshot,
  type AppAsyncTransformSnapshot,
} from './appAsyncTransformSnapshot';

export interface AppAsyncTransformResult extends AppAsyncTransformSnapshot {
  output: string;
  context?: TransformContext;
}

interface AppAsyncTransformResultInput {
  snapshot: AppAsyncTransformSnapshot;
  output: string;
  context?: TransformContext;
}

export interface AppOutputResolutionInput {
  isUpdatingFromOutput: boolean;
  pendingOutputValue: string;
  mode: TransformMode;
  activeDeepFormatResult: TransformResult | null;
  shouldUseAsyncTransform: boolean;
  currentAsyncTransformResult: AppAsyncTransformResult | null;
  getFallbackOutput: () => string;
}

export interface AppOutputResolution {
  output: string;
  shouldClearPendingOutput: boolean;
}

export const buildAppAsyncTransformResult = ({
  snapshot,
  output,
  context,
}: AppAsyncTransformResultInput): AppAsyncTransformResult => ({
  ...snapshot,
  output,
  ...(context ? { context } : {}),
});

export const buildAppAsyncTransformFallbackResult = (
  snapshot: AppAsyncTransformSnapshot,
): AppAsyncTransformResult => buildAppAsyncTransformResult({
  snapshot,
  output: snapshot.input,
});

export const getFreshAppAsyncTransformResult = (
  result: AppAsyncTransformResult | null,
  snapshot: AppAsyncTransformSnapshot,
): AppAsyncTransformResult | null => {
  if (result && isSameAppAsyncTransformSnapshot(result, snapshot)) {
    return result;
  }
  return null;
};

export const getActiveAppDeepFormatResult = (
  syncDeepFormatResult: TransformResult | null,
  mode: TransformMode,
  currentAsyncTransformResult: AppAsyncTransformResult | null
): TransformResult | null => {
  if (syncDeepFormatResult) return syncDeepFormatResult;
  if (mode === TransformMode.DEEP_FORMAT && currentAsyncTransformResult?.context) {
    return {
      output: currentAsyncTransformResult.output,
      context: currentAsyncTransformResult.context,
    };
  }
  return null;
};

export const resolveAppOutputValue = ({
  isUpdatingFromOutput,
  pendingOutputValue,
  mode,
  activeDeepFormatResult,
  shouldUseAsyncTransform,
  currentAsyncTransformResult,
  getFallbackOutput,
}: AppOutputResolutionInput): AppOutputResolution => {
  if (isUpdatingFromOutput && pendingOutputValue) {
    return {
      output: pendingOutputValue,
      shouldClearPendingOutput: false,
    };
  }

  if (mode === TransformMode.DEEP_FORMAT && activeDeepFormatResult) {
    return {
      output: activeDeepFormatResult.output,
      shouldClearPendingOutput: true,
    };
  }

  if (shouldUseAsyncTransform) {
    return currentAsyncTransformResult
      ? {
          output: currentAsyncTransformResult.output,
          shouldClearPendingOutput: true,
        }
      : {
          output: ASYNC_TRANSFORM_PLACEHOLDER,
          shouldClearPendingOutput: false,
        };
  }

  return {
    output: getFallbackOutput(),
    shouldClearPendingOutput: true,
  };
};
