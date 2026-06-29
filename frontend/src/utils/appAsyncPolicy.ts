import { TransformMode } from '../types';

export const ASYNC_TRANSFORM_THRESHOLD = 200_000;
export const ASYNC_VALIDATION_THRESHOLD = 200_000;
export const DOCUMENT_STATS_SCAN_LIMIT = 300_000;
export const ASYNC_TRANSFORM_PLACEHOLDER = '// 正在处理，请稍候...';

const ASYNC_TRANSFORM_MODES = new Set<TransformMode>([
  TransformMode.FORMAT,
  TransformMode.DEEP_FORMAT,
  TransformMode.MINIFY,
  TransformMode.SORT_KEYS,
  TransformMode.JSON_TO_TYPESCRIPT,
]);

export interface AppAsyncTransformPolicyInput {
  input: string;
  mode: TransformMode;
  isUpdatingFromOutput: boolean;
}

export interface AppAsyncTransformPolicy {
  shouldUseTransformWorker: boolean;
  shouldUseDynamicTransform: boolean;
  shouldUseAsyncTransform: boolean;
  isSourceLarge: boolean;
}

export const buildAppAsyncTransformPolicy = ({
  input,
  mode,
  isUpdatingFromOutput,
}: AppAsyncTransformPolicyInput): AppAsyncTransformPolicy => {
  const isSourceLarge = input.length >= ASYNC_TRANSFORM_THRESHOLD;
  const shouldUseTransformWorker = (
    ASYNC_TRANSFORM_MODES.has(mode) &&
    isSourceLarge &&
    !isUpdatingFromOutput
  );
  const shouldUseDynamicTransform = (
    mode === TransformMode.JSON_TO_TYPESCRIPT &&
    input.trim().length > 0 &&
    !isUpdatingFromOutput
  );

  return {
    shouldUseTransformWorker,
    shouldUseDynamicTransform,
    shouldUseAsyncTransform: shouldUseTransformWorker || shouldUseDynamicTransform,
    isSourceLarge,
  };
};
