import { useCallback, useEffect, useRef, type MutableRefObject } from 'react';
import {
  TransformMode,
  type FileTab,
  type TransformContext,
  type ValidationResult,
} from '../types';
import {
  createPreviewOutputSyncFailedResult,
  executeAppPreviewOutputSync,
  type AppPreviewOutputSyncRunnerResult,
} from '../utils/appPreviewOutputSyncRunner';
import {
  beginPreviewOutputDraft,
  clearPreviewOutputDraft,
  keepPreviewOutputDraft,
} from '../utils/appPreviewOutputDraft';
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
    if (outputChangeTimer.current) {
      clearTimeout(outputChangeTimer.current);
    }
    outputSyncRequestIdRef.current++;
  }, []);

  const cancelOutputDraft = useCallback(() => {
    if (outputChangeTimer.current) {
      clearTimeout(outputChangeTimer.current);
      outputChangeTimer.current = null;
    }
    outputSyncRequestIdRef.current++;
    clearPreviewOutputDraft(isUpdatingFromOutput, pendingOutputValue);
  }, [isUpdatingFromOutput, pendingOutputValue]);

  useEffect(() => {
    if (isUpdatingFromOutput.current) return;

    updatePreviewValidation(previewText);
  }, [isUpdatingFromOutput, previewText, updatePreviewValidation]);

  const handleOutputChange = useCallback((previewText: string) => {
    beginPreviewOutputDraft(isUpdatingFromOutput, pendingOutputValue, previewText);
    updatePreviewValidation(previewText);

    if (outputChangeTimer.current) {
      clearTimeout(outputChangeTimer.current);
    }

    const outputSyncRequestId = ++outputSyncRequestIdRef.current;
    outputChangeTimer.current = setTimeout(() => {
      outputChangeTimer.current = null;

      const syncOutputToSource = async () => {
        const currentFile = files.find(file => file.id === activeFileId);
        let syncResult: AppPreviewOutputSyncRunnerResult;
        try {
          syncResult = await executeAppPreviewOutputSync({
            previewText,
            mode,
            originalInput: inputRef.current,
            context: currentFile?.transformContext || fallbackContextRef.current,
            validateJsonMaybeAsync,
          });
        } catch {
          syncResult = createPreviewOutputSyncFailedResult();
        }

        if (outputSyncRequestId !== outputSyncRequestIdRef.current) return;

        if (syncResult.status !== 'synced') {
          setPreviewValidation(syncResult.validation);
          keepPreviewOutputDraft(pendingOutputValue, previewText);
          return;
        }

        const nextSource = syncResult.nextSource;
        onSetInput(nextSource);
        inputRef.current = nextSource;
        onUpdateActiveFileContent(nextSource);

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
