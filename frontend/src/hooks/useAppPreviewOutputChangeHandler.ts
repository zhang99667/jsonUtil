import { useCallback } from 'react';
import { beginPreviewOutputDraft } from '../utils/appPreviewOutputDraft';
import { createAppPreviewOutputSyncTask } from '../utils/appPreviewOutputSyncTask';
import type { ValidationResult } from '../types';
import type { UseAppPreviewOutputSyncInput } from './useAppPreviewOutputSyncTypes';

type PreviewOutputSyncTask = (isCurrent: () => boolean) => Promise<boolean>;
type PreviewOutputChangeHandlerFields = Pick<UseAppPreviewOutputSyncInput, 'files' | 'activeFileId' | 'mode' | 'inputRef' | 'fallbackContextRef' | 'isUpdatingFromOutput' | 'pendingOutputValue' | 'validateJsonMaybeAsync' | 'onSetInput' | 'onUpdateActiveFileContent'>;

interface UseAppPreviewOutputChangeHandlerInput
  extends PreviewOutputChangeHandlerFields {
  setPreviewValidation: (validation: ValidationResult) => void;
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

  scheduleOutputSync(createAppPreviewOutputSyncTask({
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
  }));
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
