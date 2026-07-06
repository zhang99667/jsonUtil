import { useEffect, useRef } from 'react';
import type { ValidationResult } from '../types';
import { runAppSourceValidationRequest } from '../utils/appSourceValidationRequest';
import { cleanJsonInput, isCleanJsonInputEmpty } from '../utils/jsonValidation';

interface UseAppSourceValidationInput {
  input: string;
  onSetValidation: (result: ValidationResult) => void;
}

export const SOURCE_VALIDATION_DEBOUNCE_MS = 500;

export const useAppSourceValidation = ({ input, onSetValidation }: UseAppSourceValidationInput): void => {
  const sourceValidationRequestIdRef = useRef(0);

  useEffect(() => {
    let validationTask: ReturnType<typeof runAppSourceValidationRequest> = null;
    const runValidation = () => {
      validationTask = runAppSourceValidationRequest({
        input,
        requestIdRef: sourceValidationRequestIdRef,
        onSetValidation,
      });
    };
    const invalidateValidation = () => {
      sourceValidationRequestIdRef.current += 1;
      validationTask?.cancel();
    };

    if (isCleanJsonInputEmpty(cleanJsonInput(input))) {
      runValidation();
      return invalidateValidation;
    }

    const timeoutId = setTimeout(runValidation, SOURCE_VALIDATION_DEBOUNCE_MS);

    return () => {
      clearTimeout(timeoutId);
      invalidateValidation();
    };
  }, [input, onSetValidation]);
};
