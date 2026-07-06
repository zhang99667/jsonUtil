import { useCallback } from 'react';
import {
  runAppPreviewOutputChange,
  type AppPreviewOutputChangeHandlerInput,
} from '../utils/appPreviewOutputChangeHandler';

export const useAppPreviewOutputChangeHandler = ({
  request: { files, activeFileId, mode, validateJsonMaybeAsync },
  refs: { inputRef, fallbackContextRef, pendingOutputValue },
  applyEffects: { setPreviewValidation, onSetInput, onUpdateActiveFileContent },
  isUpdatingFromOutput,
  updatePreviewValidation,
  scheduleOutputSync,
}: AppPreviewOutputChangeHandlerInput) => useCallback((previewText: string) => {
  runAppPreviewOutputChange({
    isUpdatingFromOutput,
    scheduleOutputSync,
    updatePreviewValidation,
    request: { previewText, files, activeFileId, mode, validateJsonMaybeAsync },
    refs: { inputRef, fallbackContextRef, pendingOutputValue },
    applyEffects: { setPreviewValidation, onSetInput, onUpdateActiveFileContent },
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
