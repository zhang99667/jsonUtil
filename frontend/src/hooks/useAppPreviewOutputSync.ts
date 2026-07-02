import { useCallback, useEffect, useRef, useState, type MutableRefObject } from 'react';
import {
  TransformMode,
  type FileTab,
  type TransformContext,
  type ValidationResult,
} from '../types';
import { ASYNC_VALIDATION_THRESHOLD } from '../utils/appAsyncPolicy';
import { executeAppPreviewOutputSync } from '../utils/appPreviewOutputSyncRunner';
import {
  cleanJsonInput,
  validateJsonForEditor,
} from '../utils/jsonValidation';

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
  const previewValidationRequestIdRef = useRef(0);
  const outputSyncRequestIdRef = useRef(0);
  const [previewValidation, setPreviewValidation] = useState<ValidationResult>({ isValid: true });

  useEffect(() => () => {
    if (outputChangeTimer.current) {
      clearTimeout(outputChangeTimer.current);
    }
    previewValidationRequestIdRef.current++;
    outputSyncRequestIdRef.current++;
  }, []);

  const updatePreviewValidation = useCallback((previewText: string) => {
    if (!previewText.trim()) {
      previewValidationRequestIdRef.current++;
      setPreviewValidation({ isValid: true });
      return;
    }

    const cleanValue = cleanJsonInput(previewText);
    const requestId = ++previewValidationRequestIdRef.current;
    if (cleanValue.length >= ASYNC_VALIDATION_THRESHOLD) {
      setPreviewValidation({ isValid: true });
      validateJsonMaybeAsync(cleanValue, { requireContainer: true }).then(result => {
        if (requestId === previewValidationRequestIdRef.current) {
          setPreviewValidation(result);
        }
      });
      return;
    }

    const result = validateJsonForEditor(cleanValue, { requireContainer: true });
    if (requestId === previewValidationRequestIdRef.current) {
      setPreviewValidation(result);
    }
  }, [validateJsonMaybeAsync]);

  useEffect(() => {
    if (isUpdatingFromOutput.current) return;

    updatePreviewValidation(previewText);
  }, [isUpdatingFromOutput, previewText, updatePreviewValidation]);

  const handleOutputChange = useCallback((previewText: string) => {
    pendingOutputValue.current = previewText;
    isUpdatingFromOutput.current = true;
    updatePreviewValidation(previewText);

    if (outputChangeTimer.current) {
      clearTimeout(outputChangeTimer.current);
    }

    const outputSyncRequestId = ++outputSyncRequestIdRef.current;
    outputChangeTimer.current = setTimeout(() => {
      outputChangeTimer.current = null;

      const syncOutputToSource = async () => {
        const currentFile = files.find(file => file.id === activeFileId);
        const syncResult = await executeAppPreviewOutputSync({
          previewText,
          mode,
          originalInput: inputRef.current,
          context: currentFile?.transformContext || fallbackContextRef.current,
          validateJsonMaybeAsync,
        });

        if (outputSyncRequestId !== outputSyncRequestIdRef.current) return;

        if (syncResult.status === 'invalid') {
          setPreviewValidation(syncResult.validation);
          pendingOutputValue.current = previewText;
          return;
        }

        const nextSource = syncResult.nextSource;
        onSetInput(nextSource);
        inputRef.current = nextSource;
        onUpdateActiveFileContent(nextSource);

        setTimeout(() => {
          if (!outputChangeTimer.current && outputSyncRequestId === outputSyncRequestIdRef.current) {
            isUpdatingFromOutput.current = false;
            pendingOutputValue.current = '';
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
    previewValidation,
    handleOutputChange,
  };
};
