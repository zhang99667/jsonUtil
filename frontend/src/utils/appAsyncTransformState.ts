import {
  TransformMode,
  type TransformContext,
  type TransformResult,
} from '../types';
import { ASYNC_TRANSFORM_PLACEHOLDER } from './appAsyncPolicy';

export interface AppAsyncTransformResult {
  input: string;
  mode: TransformMode;
  autoExpandScheme: boolean;
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

export const getFreshAppAsyncTransformResult = (
  result: AppAsyncTransformResult | null,
  input: string,
  mode: TransformMode,
  autoExpandScheme: boolean
): AppAsyncTransformResult | null => {
  if (
    result &&
    result.input === input &&
    result.mode === mode &&
    result.autoExpandScheme === autoExpandScheme
  ) {
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
