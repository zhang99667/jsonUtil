import { useCallback, useEffect, useRef, useState } from 'react';
import type { ValidationResult } from '../types';
import { ASYNC_VALIDATION_THRESHOLD } from '../utils/appAsyncPolicy';
import {
  cleanJsonInput,
  validateJsonForEditor,
} from '../utils/jsonValidation';

interface UseAppPreviewValidationInput {
  validateJsonMaybeAsync: (
    value: string,
    options?: { requireContainer?: boolean }
  ) => Promise<ValidationResult>;
}

const PREVIEW_VALIDATION_FAILED: ValidationResult = {
  isValid: false,
  error: 'PREVIEW 校验失败，请稍后重试',
};

export const useAppPreviewValidation = ({
  validateJsonMaybeAsync,
}: UseAppPreviewValidationInput) => {
  const previewValidationRequestIdRef = useRef(0);
  const [previewValidation, setPreviewValidation] = useState<ValidationResult>({ isValid: true });

  useEffect(() => () => {
    previewValidationRequestIdRef.current++;
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
      validateJsonMaybeAsync(cleanValue, { requireContainer: true })
        .then(result => {
          if (requestId === previewValidationRequestIdRef.current) {
            setPreviewValidation(result);
          }
        })
        .catch(() => {
          if (requestId === previewValidationRequestIdRef.current) {
            setPreviewValidation(PREVIEW_VALIDATION_FAILED);
          }
        });
      return;
    }

    const result = validateJsonForEditor(cleanValue, { requireContainer: true });
    if (requestId === previewValidationRequestIdRef.current) {
      setPreviewValidation(result);
    }
  }, [validateJsonMaybeAsync]);

  return {
    previewValidation,
    setPreviewValidation,
    updatePreviewValidation,
  };
};
