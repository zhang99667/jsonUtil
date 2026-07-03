import { useCallback } from 'react';
import {
  runAppPreviewOutputChange,
  type AppPreviewOutputChangeHandlerInput,
} from '../utils/appPreviewOutputChangeHandler';

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
}: AppPreviewOutputChangeHandlerInput) => useCallback((previewText: string) => {
  runAppPreviewOutputChange({
    previewText,
    files,
    activeFileId,
    mode,
    inputRef,
    fallbackContextRef,
    isUpdatingFromOutput,
    pendingOutputValue,
    validateJsonMaybeAsync,
    setPreviewValidation,
    updatePreviewValidation,
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
