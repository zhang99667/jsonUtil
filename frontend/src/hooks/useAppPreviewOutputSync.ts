import { useCallback, useEffect, useRef, type MutableRefObject } from 'react';
import {
  TransformMode,
  type FileTab,
  type TransformContext,
  type ValidationResult,
} from '../types';
import { runAppPreviewOutputSyncRequest } from '../utils/appPreviewOutputSyncRequest';
import {
  beginPreviewOutputDraft,
  clearPreviewOutputDraft,
} from '../utils/appPreviewOutputDraft';
import { applyAppPreviewOutputSyncResult } from '../utils/appPreviewOutputSyncResult';
import { useAppPreviewValidation } from './useAppPreviewValidation';

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

const PREVIEW_SYNC_DEBOUNCE_MS = 400;
const PREVIEW_SYNC_UNLOCK_DELAY_MS = 600;

const invalidatePendingPreviewOutputSync = (
  outputChangeTimer: MutableRefObject<NodeJS.Timeout | null>,
  outputSyncRequestIdRef: MutableRefObject<number>
) => {
  clearTimeout(outputChangeTimer.current ?? undefined);
  outputChangeTimer.current = null;
  outputSyncRequestIdRef.current++;
};

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
  const outputChangeTimer = useRef<NodeJS.Timeout | null>(null);
  const outputSyncRequestIdRef = useRef(0);
  const {
    previewValidation,
    setPreviewValidation,
    updatePreviewValidation,
  } = useAppPreviewValidation({ validateJsonMaybeAsync });

  useEffect(() => () => {
    invalidatePendingPreviewOutputSync(outputChangeTimer, outputSyncRequestIdRef);
  }, []);

  const cancelOutputDraft = useCallback(() => {
    invalidatePendingPreviewOutputSync(outputChangeTimer, outputSyncRequestIdRef);
    clearPreviewOutputDraft(isUpdatingFromOutput, pendingOutputValue);
  }, [isUpdatingFromOutput, pendingOutputValue]);

  useEffect(() => {
    if (isUpdatingFromOutput.current) return;

    updatePreviewValidation(previewText);
  }, [isUpdatingFromOutput, previewText, updatePreviewValidation]);

  const handleOutputChange = useCallback((previewText: string) => {
    beginPreviewOutputDraft(isUpdatingFromOutput, pendingOutputValue, previewText);
    updatePreviewValidation(previewText);

    invalidatePendingPreviewOutputSync(outputChangeTimer, outputSyncRequestIdRef);
    const outputSyncRequestId = outputSyncRequestIdRef.current;
    outputChangeTimer.current = setTimeout(() => {
      outputChangeTimer.current = null;

      const syncOutputToSource = async () => {
        const syncResult = await runAppPreviewOutputSyncRequest({
          previewText,
          files,
          activeFileId,
          mode,
          originalInput: inputRef.current,
          fallbackContext: fallbackContextRef.current,
          validateJsonMaybeAsync,
        });

        if (outputSyncRequestId !== outputSyncRequestIdRef.current) return;

        const didSync = applyAppPreviewOutputSyncResult({
          syncResult,
          previewText,
          inputRef,
          pendingOutputValue,
          setPreviewValidation,
          onSetInput,
          onUpdateActiveFileContent,
        });
        if (!didSync) return;

        setTimeout(() => {
          if (!outputChangeTimer.current && outputSyncRequestId === outputSyncRequestIdRef.current) {
            clearPreviewOutputDraft(isUpdatingFromOutput, pendingOutputValue);
          }
        }, PREVIEW_SYNC_UNLOCK_DELAY_MS);
      };

      void syncOutputToSource();
    }, PREVIEW_SYNC_DEBOUNCE_MS);
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
    updatePreviewValidation,
    validateJsonMaybeAsync,
  ]);

  return {
    cancelOutputDraft,
    previewValidation,
    handleOutputChange,
  };
};
