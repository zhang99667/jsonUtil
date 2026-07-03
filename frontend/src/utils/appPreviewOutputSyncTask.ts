import type {
  FileTab,
  TransformContext,
  TransformMode,
  ValidationResult,
} from '../types';
import { runAppPreviewOutputSyncRequest } from './appPreviewOutputSyncRequest';
import { applyAppPreviewOutputSyncResult } from './appPreviewOutputSyncResult';

interface MutableValueRef<T> {
  current: T;
}

export interface AppPreviewOutputSyncTaskInput {
  previewText: string;
  files: FileTab[];
  activeFileId: string | null;
  mode: TransformMode;
  inputRef: MutableValueRef<string>;
  fallbackContextRef: MutableValueRef<TransformContext | null>;
  pendingOutputValue: MutableValueRef<string>;
  validateJsonMaybeAsync: (
    value: string,
    options?: { requireContainer?: boolean }
  ) => Promise<ValidationResult>;
  setPreviewValidation: (validation: ValidationResult) => void;
  onSetInput: (value: string) => void;
  onUpdateActiveFileContent: (value: string) => void;
}

export const createAppPreviewOutputSyncTask = ({
  previewText,
  files,
  activeFileId,
  mode,
  inputRef,
  fallbackContextRef,
  pendingOutputValue,
  validateJsonMaybeAsync,
  setPreviewValidation,
  onSetInput,
  onUpdateActiveFileContent,
}: AppPreviewOutputSyncTaskInput) => async (isCurrent: () => boolean): Promise<boolean> => {
  const syncResult = await runAppPreviewOutputSyncRequest({
    previewText,
    files,
    activeFileId,
    mode,
    originalInput: inputRef.current,
    fallbackContext: fallbackContextRef.current,
    validateJsonMaybeAsync,
  });

  if (!isCurrent()) return false;

  return applyAppPreviewOutputSyncResult({
    syncResult,
    previewText,
    inputRef,
    pendingOutputValue,
    setPreviewValidation,
    onSetInput,
    onUpdateActiveFileContent,
  });
};
