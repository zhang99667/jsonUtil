import { TransformMode, type TransformContext, type TransformResult } from '../types';
import { getActiveAppDeepFormatResult, resolveAppOutputValue, type AppAsyncTransformResult } from './appAsyncTransformState';
import { formatTransformContextSummary } from './transformContextSummary';
import { deepParseWithContext, performTransform } from './transformations';

export interface AppTransformOutputInput {
  input: string;
  mode: TransformMode;
  autoExpandScheme: boolean;
  shouldUseAsyncTransform: boolean;
  currentAsyncTransformResult: AppAsyncTransformResult | null;
  isUpdatingFromOutput: boolean;
  pendingOutputValue: string;
}

export interface AppTransformOutputState {
  activeDeepFormatResult: TransformResult | null;
  deepFormatWarning?: string;
  deepFormatInfo?: string;
  transformReportContext: TransformContext | null;
  output: string;
  shouldClearPendingOutput: boolean;
}

const buildSyncDeepFormatResult = ({
  input,
  mode,
  autoExpandScheme,
  shouldUseAsyncTransform,
}: Pick<
  AppTransformOutputInput,
  'input' | 'mode' | 'autoExpandScheme' | 'shouldUseAsyncTransform'
>): TransformResult | null => {
  if (mode !== TransformMode.DEEP_FORMAT || shouldUseAsyncTransform) return null;
  return deepParseWithContext(input, { autoExpandScheme });
};

const buildDeepFormatWarning = (
  mode: TransformMode,
  activeDeepFormatResult: TransformResult | null,
): string | undefined => {
  if (mode !== TransformMode.DEEP_FORMAT) return undefined;
  const warnings = activeDeepFormatResult?.context.warnings || [];
  if (warnings.length === 0) return undefined;

  const firstWarning = warnings[0];
  return warnings.length === 1
    ? `${firstWarning.message}: ${firstWarning.path} (${firstWarning.length} 字符，阈值 ${firstWarning.limit})`
    : `已跳过 ${warnings.length} 个字符串递归展开，首个位置 ${firstWarning.path}: ${firstWarning.message}`;
};

export const buildAppTransformOutputState = ({
  input,
  mode,
  autoExpandScheme,
  shouldUseAsyncTransform,
  currentAsyncTransformResult,
  isUpdatingFromOutput,
  pendingOutputValue,
}: AppTransformOutputInput): AppTransformOutputState => {
  const syncDeepFormatResult = buildSyncDeepFormatResult({
    input,
    mode,
    autoExpandScheme,
    shouldUseAsyncTransform,
  });
  const activeDeepFormatResult = getActiveAppDeepFormatResult(
    syncDeepFormatResult,
    mode,
    currentAsyncTransformResult,
  );
  const outputResolution = resolveAppOutputValue({
    isUpdatingFromOutput,
    pendingOutputValue,
    mode,
    activeDeepFormatResult,
    shouldUseAsyncTransform,
    currentAsyncTransformResult,
    getFallbackOutput: () => performTransform(input, mode),
  });

  return {
    activeDeepFormatResult,
    deepFormatWarning: buildDeepFormatWarning(mode, activeDeepFormatResult),
    deepFormatInfo: mode === TransformMode.DEEP_FORMAT && activeDeepFormatResult
      ? formatTransformContextSummary(activeDeepFormatResult.context)
      : undefined,
    transformReportContext: mode === TransformMode.DEEP_FORMAT
      ? activeDeepFormatResult?.context || null
      : null,
    output: outputResolution.output,
    shouldClearPendingOutput: outputResolution.shouldClearPendingOutput,
  };
};
