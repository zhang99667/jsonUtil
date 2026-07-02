import { TransformMode, type TransformContext, type ValidationResult } from '../types';
import {
  resolveAppPreviewOutputSource,
  shouldValidatePreviewOutputBeforeSync,
} from './appPreviewOutputSync';

export interface AppPreviewOutputSyncRunnerInput {
  previewText: string;
  mode: TransformMode;
  originalInput: string;
  context: TransformContext | null;
  validateJsonMaybeAsync: (value: string) => Promise<ValidationResult>;
}

export const PREVIEW_OUTPUT_SYNC_FAILED: ValidationResult = {
  isValid: false,
  error: 'PREVIEW 回写失败，请检查当前内容后重试',
};

export type AppPreviewOutputSyncRunnerResult =
  | {
    status: 'invalid';
    validation: ValidationResult;
  }
  | {
    status: 'failed';
    validation: ValidationResult;
  }
  | {
    status: 'synced';
    nextSource: string;
  };

export const executeAppPreviewOutputSync = async ({
  previewText,
  mode,
  originalInput,
  context,
  validateJsonMaybeAsync,
}: AppPreviewOutputSyncRunnerInput): Promise<AppPreviewOutputSyncRunnerResult> => {
  try {
    if (shouldValidatePreviewOutputBeforeSync(mode)) {
      const validation = await validateJsonMaybeAsync(previewText);
      if (!validation.isValid) {
        return {
          status: 'invalid',
          validation,
        };
      }
    }

    return {
      status: 'synced',
      nextSource: resolveAppPreviewOutputSource({
        previewText,
        mode,
        originalInput,
        context,
      }),
    };
  } catch {
    return {
      status: 'failed',
      validation: PREVIEW_OUTPUT_SYNC_FAILED,
    };
  }
};
