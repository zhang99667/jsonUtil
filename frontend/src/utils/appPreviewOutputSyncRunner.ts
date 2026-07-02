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

export type AppPreviewOutputSyncRunnerResult =
  | {
    status: 'invalid';
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
};
