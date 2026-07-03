import { useCallback } from 'react';
import { beginPreviewOutputDraft } from '../utils/appPreviewOutputDraft';
import { scheduleAppPreviewOutputChangeTask } from '../utils/appPreviewOutputChangeTask';
import type { AppPreviewOutputSyncTaskInput } from '../utils/appPreviewOutputSyncTaskTypes';
import type { MutableValueRef } from '../utils/mutableValueRef';

type PreviewOutputSyncTask = (isCurrent: () => boolean) => Promise<boolean>;

interface UseAppPreviewOutputChangeHandlerInput
  extends Omit<AppPreviewOutputSyncTaskInput, 'previewText'> {
  isUpdatingFromOutput: MutableValueRef<boolean>;
  updatePreviewValidation: (previewText: string) => void;
  scheduleOutputSync: (task: PreviewOutputSyncTask) => void;
}

export const useAppPreviewOutputChangeHandler = ({
  files,
  activeFileId,
  mode,
  inputRef,
  fallbackContextRef,
  isUpdatingFromOutput,
  pendingOutputValue,
  validateJsonMaybeAsync,
  onSetInput,
  onUpdateActiveFileContent,
  setPreviewValidation,
  updatePreviewValidation,
  scheduleOutputSync,
}: UseAppPreviewOutputChangeHandlerInput) => useCallback((previewText: string) => {
  beginPreviewOutputDraft(isUpdatingFromOutput, pendingOutputValue, previewText);
  updatePreviewValidation(previewText);

  scheduleAppPreviewOutputChangeTask({
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
    scheduleOutputSync,
  });
}, [
  activeFileId,
  fallbackContextRef,
  files,
  inputRef,
  isUpdatingFromOutput,
  mode,
  onSetInput,
  onUpdateActiveFileContent,
  pendingOutputValue,
  scheduleOutputSync,
  setPreviewValidation,
  updatePreviewValidation,
  validateJsonMaybeAsync,
]);
