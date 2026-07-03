import { useEffect } from 'react';
import { useAppPreviewValidation } from './useAppPreviewValidation';
import { useAppPreviewOutputDraftScheduler } from './useAppPreviewOutputDraftScheduler';
import { useAppPreviewOutputChangeHandler } from './useAppPreviewOutputChangeHandler';
import type { UseAppPreviewOutputSyncInput } from './useAppPreviewOutputSyncTypes';

export const useAppPreviewOutputSync = ({
  previewText,
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
}: UseAppPreviewOutputSyncInput) => {
  const {
    previewValidation,
    setPreviewValidation,
    updatePreviewValidation,
  } = useAppPreviewValidation({ validateJsonMaybeAsync });

  const { cancelOutputDraft, scheduleOutputSync } = useAppPreviewOutputDraftScheduler({
    isUpdatingFromOutput,
    pendingOutputValue,
  });

  useEffect(() => {
    if (isUpdatingFromOutput.current) return;

    updatePreviewValidation(previewText);
  }, [isUpdatingFromOutput, previewText, updatePreviewValidation]);

  const handleOutputChange = useAppPreviewOutputChangeHandler({
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
  });

  return {
    cancelOutputDraft,
    previewValidation,
    handleOutputChange,
  };
};
