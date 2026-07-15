import { useCallback, useEffect, useRef, useState } from 'react';
import type { ValidationResult } from '../types';
import { ASYNC_VALIDATION_THRESHOLD } from '../utils/appAsyncPolicy';
import {
  cleanJsonInput,
  type ValidateJsonMaybeAsync,
  validateJsonForEditor,
} from '../utils/jsonValidation';

interface UseAppPreviewValidationInput {
  validateJsonMaybeAsync: ValidateJsonMaybeAsync;
}

const PREVIEW_VALIDATION_FAILED: ValidationResult = {
  isValid: false,
  error: 'PREVIEW 校验失败，请稍后重试',
};

export const useAppPreviewValidation = ({
  validateJsonMaybeAsync,
}: UseAppPreviewValidationInput) => {
  const previewValidationRequestIdRef = useRef(0);
  const previewValidationAbortControllerRef = useRef<AbortController | null>(null);
  const [previewValidation, setPreviewValidation] = useState<ValidationResult>({ isValid: true });

  const cancelPreviewValidation = useCallback(() => {
    previewValidationRequestIdRef.current++;
    previewValidationAbortControllerRef.current?.abort();
    previewValidationAbortControllerRef.current = null;
  }, []);

  useEffect(() => cancelPreviewValidation, [cancelPreviewValidation]);

  const updatePreviewValidation = useCallback((previewText: string) => {
    cancelPreviewValidation();
    if (!previewText.trim()) {
      setPreviewValidation({ isValid: true });
      return;
    }

    const cleanValue = cleanJsonInput(previewText);
    const requestId = previewValidationRequestIdRef.current;
    if (cleanValue.length >= ASYNC_VALIDATION_THRESHOLD) {
      const abortController = new AbortController();
      previewValidationAbortControllerRef.current = abortController;
      setPreviewValidation({ isValid: true });
      validateJsonMaybeAsync(cleanValue, {
        requireContainer: true,
        signal: abortController.signal,
      })
        .then(result => {
          if (requestId === previewValidationRequestIdRef.current) {
            setPreviewValidation(result);
          }
        })
        .catch(() => {
          if (requestId === previewValidationRequestIdRef.current) {
            setPreviewValidation(PREVIEW_VALIDATION_FAILED);
          }
        })
        .finally(() => {
          if (previewValidationAbortControllerRef.current === abortController) {
            previewValidationAbortControllerRef.current = null;
          }
        });
      return;
    }

    const result = validateJsonForEditor(cleanValue, { requireContainer: true });
    if (requestId === previewValidationRequestIdRef.current) {
      setPreviewValidation(result);
    }
  }, [cancelPreviewValidation, validateJsonMaybeAsync]);

  return {
    cancelPreviewValidation,
    previewValidation,
    setPreviewValidation,
    updatePreviewValidation,
  };
};
