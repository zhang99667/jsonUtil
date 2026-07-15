import { useCallback, useEffect } from 'react';
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
    cancelPreviewValidation,
    previewValidation,
    setPreviewValidation,
    updatePreviewValidation,
  } = useAppPreviewValidation({ validateJsonMaybeAsync });

  const { cancelOutputDraft, scheduleOutputSync } = useAppPreviewOutputDraftScheduler({
    isUpdatingFromOutput,
    pendingOutputValue,
    onBeforeSync: cancelPreviewValidation,
  });

  const cancelOutputDraftAndValidation = useCallback(() => {
    cancelPreviewValidation();
    cancelOutputDraft();
  }, [cancelOutputDraft, cancelPreviewValidation]);

  useEffect(() => {
    if (isUpdatingFromOutput.current) return;

    updatePreviewValidation(previewText);
  }, [isUpdatingFromOutput, previewText, updatePreviewValidation]);

  const handleOutputChange = useAppPreviewOutputChangeHandler({
    isUpdatingFromOutput,
    scheduleOutputSync,
    updatePreviewValidation,
    request: { files, activeFileId, mode, validateJsonMaybeAsync },
    refs: { inputRef, fallbackContextRef, pendingOutputValue },
    applyEffects: { setPreviewValidation, onSetInput, onUpdateActiveFileContent },
  });

  return {
    cancelOutputDraft: cancelOutputDraftAndValidation,
    previewValidation,
    handleOutputChange,
  };
};
