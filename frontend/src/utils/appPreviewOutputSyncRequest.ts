import { TransformMode, type FileTab, type TransformContext, type ValidationResult } from '../types';
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
  validateJsonMaybeAsync: (value: string) => Promise<ValidationResult>;
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
  validateJsonMaybeAsync,
}: AppPreviewOutputSyncRequestInput): Promise<AppPreviewOutputSyncRunnerResult> => {
  try {
    return await executeAppPreviewOutputSync({
      previewText,
      mode,
      originalInput,
      context: resolveAppPreviewOutputSyncContext(files, activeFileId, fallbackContext),
      validateJsonMaybeAsync,
    });
  } catch {
    return createPreviewOutputSyncFailedResult();
  }
};
