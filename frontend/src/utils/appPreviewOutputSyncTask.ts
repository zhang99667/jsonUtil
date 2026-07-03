import { runAppPreviewOutputSyncRequest } from './appPreviewOutputSyncRequest';
import { applyAppPreviewOutputSyncResult } from './appPreviewOutputSyncResult';
import type { AppPreviewOutputSyncTaskInput } from './appPreviewOutputSyncTaskTypes';

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
