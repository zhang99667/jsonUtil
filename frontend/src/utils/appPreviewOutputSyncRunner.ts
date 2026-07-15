import { TransformMode, type TransformContext, type ValidationResult } from '../types';
import type { ValidateJsonMaybeAsync } from './jsonValidation';
import {
  resolveAppPreviewOutputSource,
  shouldValidatePreviewOutputBeforeSync,
} from './appPreviewOutputSync';

export interface AppPreviewOutputSyncRunnerInput {
  previewText: string;
  mode: TransformMode;
  originalInput: string;
  context: TransformContext | null;
  signal?: AbortSignal;
  validateJsonMaybeAsync: ValidateJsonMaybeAsync;
}

export const PREVIEW_OUTPUT_SYNC_FAILED: ValidationResult = {
  isValid: false,
  error: 'PREVIEW 回写失败，请检查当前内容后重试',
};

export type AppPreviewOutputSyncRunnerResult =
  | { status: 'invalid' | 'failed'; validation: ValidationResult }
  | { status: 'synced'; nextSource: string };

export const createPreviewOutputSyncFailedResult = (): AppPreviewOutputSyncRunnerResult => ({
  status: 'failed',
  validation: PREVIEW_OUTPUT_SYNC_FAILED,
});

export const executeAppPreviewOutputSync = async ({
  previewText,
  mode,
  originalInput,
  context,
  signal,
  validateJsonMaybeAsync,
}: AppPreviewOutputSyncRunnerInput): Promise<AppPreviewOutputSyncRunnerResult> => {
  try {
    if (shouldValidatePreviewOutputBeforeSync(mode)) {
      const validation = signal
        ? await validateJsonMaybeAsync(previewText, { signal })
        : await validateJsonMaybeAsync(previewText);
      if (!validation.isValid) {
        return { status: 'invalid', validation };
      }
    }

    return {
      status: 'synced',
      nextSource: resolveAppPreviewOutputSource({ previewText, mode, originalInput, context }),
    };
  } catch {
    return createPreviewOutputSyncFailedResult();
  }
};
