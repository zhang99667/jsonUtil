import { useCallback, useEffect, type MutableRefObject } from 'react';
import {
  TransformMode,
  type FileTab,
  type TransformContext,
  type ValidationResult,
} from '../types';
import {
  beginPreviewOutputDraft,
  clearPreviewOutputDraft,
} from '../utils/appPreviewOutputDraft';
import { createAppPreviewOutputSyncTask } from '../utils/appPreviewOutputSyncTask';
import { useAppPreviewValidation } from './useAppPreviewValidation';
import { useAppPreviewOutputSyncScheduler } from './useAppPreviewOutputSyncScheduler';

interface UseAppPreviewOutputSyncInput {
  previewText: string;
  files: FileTab[];
  activeFileId: string | null;
  mode: TransformMode;
  inputRef: MutableRefObject<string>;
  fallbackContextRef: MutableRefObject<TransformContext | null>;
  isUpdatingFromOutput: MutableRefObject<boolean>;
  pendingOutputValue: MutableRefObject<string>;
  validateJsonMaybeAsync: (
    value: string,
    options?: { requireContainer?: boolean }
  ) => Promise<ValidationResult>;
  onSetInput: (value: string) => void;
  onUpdateActiveFileContent: (value: string) => void;
}

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

  const clearOutputDraft = useCallback(() => {
    clearPreviewOutputDraft(isUpdatingFromOutput, pendingOutputValue);
  }, [isUpdatingFromOutput, pendingOutputValue]);

  const { cancelOutputDraft, scheduleOutputSync } = useAppPreviewOutputSyncScheduler({
    clearOutputDraft,
  });

  useEffect(() => {
    if (isUpdatingFromOutput.current) return;

    updatePreviewValidation(previewText);
  }, [isUpdatingFromOutput, previewText, updatePreviewValidation]);

  const handleOutputChange = useCallback((previewText: string) => {
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

  return {
    cancelOutputDraft,
    previewValidation,
    handleOutputChange,
  };
};
