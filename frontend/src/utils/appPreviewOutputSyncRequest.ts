import { TransformMode, type FileTab, type TransformContext } from '../types';
import type { ValidateJsonMaybeAsync } from './jsonValidation';
import {
  createPreviewOutputSyncFailedResult,
  executeAppPreviewOutputSync,
  type AppPreviewOutputSyncRunnerResult,
} from './appPreviewOutputSyncRunner';

export interface AppPreviewOutputSyncRequestInput {
  previewText: string;
  files: FileTab[];
  activeFileId: string | null;
  mode: TransformMode;
  originalInput: string;
  fallbackContext: TransformContext | null;
  signal?: AbortSignal;
  validateJsonMaybeAsync: ValidateJsonMaybeAsync;
}

export const resolveAppPreviewOutputSyncContext = (
  files: FileTab[],
  activeFileId: string | null,
  fallbackContext: TransformContext | null
): TransformContext | null => (
  files.find(file => file.id === activeFileId)?.transformContext || fallbackContext
);

export const runAppPreviewOutputSyncRequest = async ({
  previewText,
  files,
  activeFileId,
  mode,
  originalInput,
  fallbackContext,
  signal,
  validateJsonMaybeAsync,
}: AppPreviewOutputSyncRequestInput): Promise<AppPreviewOutputSyncRunnerResult> => {
  try {
    return await executeAppPreviewOutputSync({
      previewText,
      mode,
      originalInput,
      context: resolveAppPreviewOutputSyncContext(files, activeFileId, fallbackContext),
      signal,
      validateJsonMaybeAsync,
    });
  } catch {
    return createPreviewOutputSyncFailedResult();
  }
};
